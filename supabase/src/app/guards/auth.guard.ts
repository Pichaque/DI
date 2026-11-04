import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/**
 * Guard de autenticación: sólo deja pasar a las páginas privadas (home, galería)
 * si hay una sesión activa en Supabase.
 */
export const authGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  await supabaseService.restoreSession();

  if (supabaseService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
