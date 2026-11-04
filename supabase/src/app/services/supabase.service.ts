import { Injectable, computed, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Client } from '../models/client.model';
import { StorageImage } from '../models/storage-image.model';
import { UserRole } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly supabase: SupabaseClient;

  /** Promesa de restauración de sesión, para que el guard pueda esperar */
  private sessionPromise: Promise<void> | null = null;

  // Señales reactivas para el estado global de la aplicación
  public readonly currentUser = signal<User | null>(null);
  public readonly userRole = signal<UserRole | null>(null);

  public readonly isAuthenticated = computed(() => this.currentUser() !== null);
  public readonly isAdmin = computed(() => this.userRole() === 'admin');

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      },
    );

    // Escuchamos los cambios de sesión (login, logout, refresh token...)
    this.supabase.auth.onAuthStateChange((_event, session) => {
      // Se ejecuta fuera del callback para no bloquear el lock interno de Supabase
      setTimeout(() => {
        this.currentUser.set(session?.user ?? null);
        if (session?.user) {
          void this.loadRole(session.user.id);
        } else {
          this.userRole.set(null);
        }
      }, 0);
    });
  }

  // ---------------------------------------------------------------------------
  // AUTENTICACIÓN Y ROLES
  // ---------------------------------------------------------------------------

  /**
   * Restaura la sesión guardada en el navegador (localStorage).
   * Es idempotente: siempre devuelve la misma promesa.
   */
  restoreSession(): Promise<void> {
    if (!this.sessionPromise) {
      this.sessionPromise = this.initSession();
    }
    return this.sessionPromise;
  }

  private async initSession(): Promise<void> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (session?.user) {
      this.currentUser.set(session.user);
      await this.loadRole(session.user.id);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const {
      data,
      error,
    } = await this.supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      this.currentUser.set(data.user);
      await this.loadRole(data.user.id);
    }
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }
    this.currentUser.set(null);
    this.userRole.set(null);
  }

  /** Lee el rol del usuario autenticado desde la tabla `profiles`. */
  async loadRole(userId: string): Promise<void> {
    const {
      data,
      error,
    } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && data) {
      this.userRole.set(data.role as UserRole);
    }
  }

  // ---------------------------------------------------------------------------
  // CRUD CLIENTES
  // ---------------------------------------------------------------------------

  async getClients(): Promise<Client[]> {
    const {
      data,
      error,
    } = await this.supabase
      .from('clients')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async createClient(client: Client): Promise<void> {
    const {
      error,
    } = await this.supabase.from('clients').insert([
      {
        nombre: client.nombre,
        empresa: client.empresa,
        email: client.email,
      },
    ]);

    if (error) {
      throw error;
    }
  }

  async updateClient(id: string, client: Partial<Client>): Promise<void> {
    const {
      error,
    } = await this.supabase
      .from('clients')
      .update({
        nombre: client.nombre,
        empresa: client.empresa,
        email: client.email,
      })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async deleteClient(id: string): Promise<void> {
    const {
      error,
    } = await this.supabase.from('clients').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // STORAGE BUCKET (galería de imágenes)
  // ---------------------------------------------------------------------------

  /**
   * Lista los ficheros de un bucket y devuelve la URL de cada imagen.
   * Usa URL firmadas (bucket privado) y cae a la URL pública si no es posible.
   */
  async listImages(bucket: string = environment.storageBucket): Promise<StorageImage[]> {
    const {
      data,
      error,
    } = await this.supabase.storage.from(bucket).list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw error;
    }

    const files = (data ?? []).filter((file) => file.name && file.id !== null);

    return Promise.all(
      files.map(async (file) => ({
        name: file.name,
        path: file.name,
        url: await this.getImageUrl(bucket, file.name),
        size: file.metadata?.size ?? null,
        contentType: file.metadata?.mimetype ?? null,
        updatedAt: file.updated_at ?? null,
      })),
    );
  }

  /** URL temporal (1 hora) de un objeto del bucket. Si falla, devuelve la URL pública. */
  async getImageUrl(bucket: string, path: string): Promise<string> {
    const {
      data,
      error,
    } = await this.supabase.storage.from(bucket).createSignedUrl(path, 3600);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }

    return this.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  /** Sube una imagen al bucket (solo admins). */
  async uploadImage(
    file: File,
    bucket: string = environment.storageBucket,
  ): Promise<void> {
    const {
      error,
    } = await this.supabase.storage.from(bucket).upload(file.name, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      throw error;
    }
  }

  /** Borra una imagen del bucket (solo admins). */
  async deleteImage(
    path: string,
    bucket: string = environment.storageBucket,
  ): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }
  }
}
