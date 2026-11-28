import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type MotivoListaNegra = 'ABANDONO' | 'CONDUCTA' | 'INCUMPLIMIENTO';

export interface ListaNegraRequest {
  ciPostulante: string;
  motivo: MotivoListaNegra;
  idRegistradoPor: number;
  observaciones?: string;
}

export interface ListaNegraResponse {
  id: number;
  ciPostulante: string;
  nombrePostulante?: string;
  motivo: MotivoListaNegra;
  observaciones?: string;
  fechaRegistro: string;
  registradoPorNombre: string;
  activo: boolean;
}

export interface ListaNegraCandidatoResponse {
  idUsuario: number;
  nombreCompleto: string;
  ci: string;
  programas: string[];
}

@Injectable({ providedIn: 'root' })
export class ListaNegraService {
  constructor(private api: ApiService) {}

  listarActivos(): Observable<ListaNegraResponse[]> {
    return this.api.get<ListaNegraResponse[]>('/lista-negra');
  }

  listarCandidatosAbandono(): Observable<ListaNegraCandidatoResponse[]> {
    return this.api.get<ListaNegraCandidatoResponse[]>('/lista-negra/candidatos-abandono');
  }

  agregar(request: ListaNegraRequest): Observable<ListaNegraResponse> {
    return this.api.post<ListaNegraResponse>('/lista-negra', request);
  }

  desactivar(id: number): Observable<ListaNegraResponse> {
    return this.api.patch<ListaNegraResponse>(`/lista-negra/${id}/desactivar`);
  }
}
