import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PostulacionRequest, PostulacionResponse, EstadoPostulacion } from '../models/postulacion.model';

@Injectable({ providedIn: 'root' })
export class PostulacionService {
  constructor(private api: ApiService) {}

  crear(request: PostulacionRequest): Observable<PostulacionResponse> {
    return this.api.post<PostulacionResponse>('/postulaciones', request);
  }

  obtenerPorId(id: number): Observable<PostulacionResponse> {
    return this.api.get<PostulacionResponse>(`/postulaciones/${id}`);
  }

  listarPorUsuario(idUsuario: number): Observable<PostulacionResponse[]> {
    return this.api.get<PostulacionResponse[]>(`/postulaciones/usuario/${idUsuario}`);
  }

  listarPorPrograma(idPrograma: number): Observable<PostulacionResponse[]> {
    return this.api.get<PostulacionResponse[]>(`/postulaciones/programa/${idPrograma}`);
  }

  cambiarEstado(id: number, estado: EstadoPostulacion): Observable<PostulacionResponse> {
    return this.api.patch<PostulacionResponse>(`/postulaciones/${id}/estado`, { estado });
  }
}
