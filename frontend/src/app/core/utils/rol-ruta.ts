import { RolUsuario } from '../models/usuario.model';

/** Ruta inicial del panel correspondiente a cada rol tras iniciar sesión. */
export function rutaInicialPorRol(rol: RolUsuario): string {
  switch (rol) {
    case 'ADMIN': return '/admin';
    case 'EVALUADOR': return '/evaluador';
    default: return '/portal';
  }
}
