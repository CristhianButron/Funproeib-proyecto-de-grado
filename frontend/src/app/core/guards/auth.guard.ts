import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/usuario.model';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.estaAutenticado()) return true;
  router.navigate(['/login']);
  return false;
};

// Exige el rol indicado y, si ya inició sesión con ese rol, que no tenga
// pendiente el cambio obligatorio de la contraseña temporal del primer
// ingreso (ver UsuarioServiceImpl.debeCambiarPassword en el backend).
function roleGuard(rol: RolUsuario): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.usuario()?.rol !== rol) {
      router.navigate(['/login']);
      return false;
    }
    if (auth.usuario()?.debeCambiarPassword) {
      router.navigate(['/cambiar-password']);
      return false;
    }
    return true;
  };
}

export const adminGuard: CanActivateFn = roleGuard('ADMIN');
export const postulanteGuard: CanActivateFn = roleGuard('POSTULANTE');
export const evaluadorGuard: CanActivateFn = roleGuard('EVALUADOR');
