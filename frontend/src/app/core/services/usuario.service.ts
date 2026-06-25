import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { LoginRequest, UsuarioRegistroRequest, UsuarioResponse } from '../models/usuario.model';

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
}
