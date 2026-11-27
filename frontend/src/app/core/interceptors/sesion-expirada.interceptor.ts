import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Si el backend responde 401 (token vencido, inválido, o la cuenta fue
 * desactivada mientras había sesión), cierra la sesión local y manda a
 * /login con un aviso. Sin esto, la sesión quedaba "colgada": cada acción
 * fallaba en silencio hasta que la persona recargaba la página a mano.
 *
 * El chequeo de estaAutenticado() es clave: un 401 de un login con
 * credenciales incorrectas NO debe disparar esto (en ese momento todavía no
 * hay sesión que cerrar).
 */
export const sesionExpiradaInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err?.status === 401 && auth.estaAutenticado()) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { sesionExpirada: '1' } });
      }
      return throwError(() => err);
    }),
  );
};
