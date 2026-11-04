import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  logInOutline,
  lockClosedOutline,
  mailOutline,
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonNote,
    IonSpinner,
  ],
})
export class LoginPage {
  private readonly supabaseService = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor() {
    addIcons({ alertCircleOutline, logInOutline, lockClosedOutline, mailOutline });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    try {
      const { email, password } = this.loginForm.value;
      await this.supabaseService.login(email, password);
      await this.router.navigateByUrl('/clientes');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      this.errorMessage = this.translateError(message);
    } finally {
      this.isLoading = false;
    }
  }

  /** Traduce los errores más habituales de Supabase Auth a un mensaje en español. */
  private translateError(message: string): string {
    if (message.includes('Invalid login credentials')) {
      return 'Credenciales incorrectas. Revisa el email y la contraseña.';
    }
    if (message.includes('Email not confirmed')) {
      return 'El usuario no está confirmado. Revisa el email de confirmación.';
    }
    if (message.includes('fetch')) {
      return 'No se pudo conectar con Supabase. Revisa la URL y la clave anon.';
    }
    return message;
  }
}
