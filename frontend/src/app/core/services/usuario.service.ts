import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CambiarPasswordRequest, LoginRequest, ReenviarVerificacionRequest, UsuarioRegistroRequest, UsuarioResponse } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private api: ApiService) {}

  registrar(request: UsuarioRegistroRequest): Observable<UsuarioResponse> {
    return this.api.post<UsuarioResponse>('/usuarios/registro', request);
  }

  login(request: LoginRequest): Observable<UsuarioResponse> {
    return this.api.post<UsuarioResponse>('/usuarios/login', request);
  }

  obtenerPorId(id: number): Observable<UsuarioResponse> {
    return this.api.get<UsuarioResponse>(`/usuarios/${id}`);
  }

  listarTodos(): Observable<UsuarioResponse[]> {
    return this.api.get<UsuarioResponse[]>('/usuarios');
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
}
