import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CambiarPasswordObligatorioRequest, CambiarPasswordRequest, LoginRequest, OlvidePasswordRequest, ReenviarVerificacionRequest, RestablecerPasswordRequest, RolUsuario, UsuarioActualizarRequest, UsuarioRegistroRequest, UsuarioResponse } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private api: ApiService) {}

  registrar(request: UsuarioRegistroRequest, carnetAnverso: File, carnetReverso: File): Observable<UsuarioResponse> {
    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    formData.append('carnetAnverso', carnetAnverso);
    formData.append('carnetReverso', carnetReverso);
    return this.api.post<UsuarioResponse>('/usuarios/registro', formData);
  }

  login(request: LoginRequest): Observable<UsuarioResponse> {
    return this.api.post<UsuarioResponse>('/usuarios/login', request);
  }

  obtenerPorId(id: number): Observable<UsuarioResponse> {
    return this.api.get<UsuarioResponse>(`/usuarios/${id}`);
  }

  actualizarPerfil(id: number, request: UsuarioActualizarRequest): Observable<UsuarioResponse> {
    return this.api.put<UsuarioResponse>(`/usuarios/${id}`, request);
  }

  listarTodos(): Observable<UsuarioResponse[]> {
    return this.api.get<UsuarioResponse[]>('/usuarios');
  }

  listarPendientesIdentidad(): Observable<UsuarioResponse[]> {
    return this.api.get<UsuarioResponse[]>('/usuarios/pendientes-identidad');
  }

  verificarCorreo(token: string): Observable<void> {
    return this.api.get<void>(`/usuarios/verificar-correo?token=${encodeURIComponent(token)}`);
  }

  reenviarVerificacion(request: ReenviarVerificacionRequest): Observable<void> {
    return this.api.post<void>('/usuarios/reenviar-verificacion', request);
  }

  cambiarPassword(request: CambiarPasswordRequest): Observable<void> {
    return this.api.post<void>('/usuarios/cambiar-password', request);
  }

  cambiarPasswordObligatorio(request: CambiarPasswordObligatorioRequest): Observable<void> {
    return this.api.post<void>('/usuarios/cambiar-password-obligatorio', request);
  }

  olvidePassword(request: OlvidePasswordRequest): Observable<void> {
    return this.api.post<void>('/usuarios/olvide-password', request);
  }

  restablecerPassword(request: RestablecerPasswordRequest): Observable<void> {
    return this.api.post<void>('/usuarios/restablecer-password', request);
  }

  cambiarRol(id: number, rol: RolUsuario): Observable<UsuarioResponse> {
    return this.api.patch<UsuarioResponse>(`/usuarios/${id}/rol`, { rol });
  }

  cambiarActivo(id: number, activo: boolean): Observable<UsuarioResponse> {
    return this.api.patch<UsuarioResponse>(`/usuarios/${id}/activo`, { activo: String(activo) });
  }

  verificarIdentidad(id: number): Observable<UsuarioResponse> {
    return this.api.patch<UsuarioResponse>(`/usuarios/${id}/identidad/verificar`);
  }

  // Elimina la cuenta completa del postulante (ver UsuarioServiceImpl en el
  // backend): la cuenta deja de existir, no queda en ningún estado "rechazada".
  rechazarIdentidad(id: number): Observable<void> {
    return this.api.patch<void>(`/usuarios/${id}/identidad/rechazar`);
  }

  obtenerCarnet(id: number, lado: 'anverso' | 'reverso'): Observable<Blob> {
    return this.api.getBlob(`/usuarios/${id}/carnet/${lado}`);
  }

  // Distinta de rechazarIdentidad: esta es una baja administrativa normal
  // (sin correo de aviso), para cuentas que ya no corresponde que existan.
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`/usuarios/${id}`);
  }
}
