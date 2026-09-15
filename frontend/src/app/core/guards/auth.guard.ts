import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.estaAutenticado()) return true;
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.esAdmin()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.usuario()?.debeCambiarPassword) {
    router.navigate(['/cambiar-password']);
    return false;
  }
  return true;
};

export const postulanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.esPostulante()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.usuario()?.debeCambiarPassword) {
    router.navigate(['/cambiar-password']);
    return false;
  }
  return true;
};
