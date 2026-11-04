import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonNote,
  IonRow,
  IonCol,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonToast,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  imagesOutline,
  logOutOutline,
  refreshOutline,
  trashOutline,
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { StorageImage } from '../models/storage-image.model';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-gallery',
  templateUrl: 'gallery.page.html',
  styleUrls: ['gallery.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonBadge,
    IonNote,
    IonSpinner,
    IonToast,
  ],
})
export class GalleryPage implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly images = signal<StorageImage[]>([]);
  readonly isLoading = signal(false);
  readonly bucket = environment.storageBucket;

  toastMessage = '';
  isToastOpen = false;

  readonly isAdmin = this.supabaseService.isAdmin;
  readonly userRole = this.supabaseService.userRole;

  constructor() {
    addIcons({
      cloudUploadOutline,
      imagesOutline,
      logOutOutline,
      refreshOutline,
      trashOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadImages();
  }

  async loadImages(): Promise<void> {
    this.isLoading.set(true);
    try {
      const images = await this.supabaseService.listImages(this.bucket);
      this.images.set(images);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      this.showToast('No se pudieron cargar las imágenes: ' + message);
      this.images.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Sube el fichero seleccionado al bucket de Storage. */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      await this.supabaseService.uploadImage(file, this.bucket);
      this.showToast('Imagen subida correctamente');
      await this.loadImages();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      this.showToast('Error subiendo la imagen: ' + message);
    } finally {
      input.value = '';
    }
  }

  async deleteImage(path: string): Promise<void> {
    try {
      await this.supabaseService.deleteImage(path, this.bucket);
      this.showToast('Imagen eliminada');
      await this.loadImages();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      this.showToast('Error eliminando la imagen: ' + message);
    }
  }

  async logout(): Promise<void> {
    await this.supabaseService.logout();
    await this.router.navigateByUrl('/login');
  }

  setToastOpen(isOpen: boolean): void {
    this.isToastOpen = isOpen;
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }
}
