import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  createOutline,
  logOutOutline,
  trashOutline,
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { Client } from '../models/client.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonIcon,
    IonInput,
    IonSearchbar,
    IonNote,
    IonToast,
  ],
})
export class HomePage implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly clients = signal<Client[]>([]);
  clientForm: FormGroup;
  editingClientId: string | null = null;

  toastMessage = '';
  isToastOpen = false;

  readonly searchTerm = signal('');
  readonly isLoading = signal(false);

  // Señales expuestas a la vista (RBAC)
  readonly isAdmin = this.supabaseService.isAdmin;
  readonly userRole = this.supabaseService.userRole;
  readonly currentUser = this.supabaseService.currentUser;

  /** Lista filtrada por el texto de búsqueda */
  readonly filteredClients = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const clients = this.clients();
    if (!term) {
      return clients;
    }
    return clients.filter(
      (client) =>
        client.nombre.toLowerCase().includes(term) ||
        client.empresa.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term),
    );
  });

  constructor() {
    addIcons({ createOutline, trashOutline, logOutOutline });

    this.clientForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      empresa: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadClients();
  }

  async loadClients(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.clients.set(await this.supabaseService.getClients());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      this.showToast('Error cargando clientes: ' + message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveClient(): Promise<void> {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.clientForm.value;

      if (this.editingClientId) {
        await this.supabaseService.updateClient(this.editingClientId, formValue);
        this.showToast('Cliente actualizado');
      } else {
        await this.supabaseService.createClient(formValue);
        this.showToast('Cliente insertado');
      }

      this.resetForm();
      await this.loadClients();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      this.showToast('Error de guardado (¿Eres admin?): ' + message);
    }
  }

  editClient(client: Client): void {
    this.editingClientId = client.id ?? null;
    this.clientForm.patchValue({
      nombre: client.nombre,
      empresa: client.empresa,
      email: client.email,
    });
  }

  async deleteClient(id: string): Promise<void> {
    try {
      await this.supabaseService.deleteClient(id);
      this.showToast('Cliente eliminado');
      await this.loadClients();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      this.showToast('Error eliminando: ' + message);
    }
  }

  resetForm(): void {
    this.clientForm.reset();
    this.editingClientId = null;
  }

  async logout(): Promise<void> {
    await this.supabaseService.logout();
    await this.router.navigateByUrl('/login');
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLIonSearchbarElement).value ?? '';
    this.searchTerm.set(value);
  }

  setToastOpen(isOpen: boolean): void {
    this.isToastOpen = isOpen;
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }
}
