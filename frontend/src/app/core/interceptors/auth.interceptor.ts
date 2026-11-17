import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Agrega el token JWT de la sesión activa a cada petición saliente. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).usuario()?.token;
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
