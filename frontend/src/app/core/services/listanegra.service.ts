import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type MotivoListaNegra = 'ABANDONO' | 'CONDUCTA' | 'INCUMPLIMIENTO';

export interface ListaNegraRequest {
  ciPostulante: string;
  motivo: MotivoListaNegra;
  idRegistradoPor: number;
}

export interface ListaNegraResponse {
  id: number;
  ciPostulante: string;
  motivo: MotivoListaNegra;
  fechaRegistro: string;
  registradoPorNombre: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ListaNegraService {
  constructor(private api: ApiService) {}

  listarActivos(): Observable<ListaNegraResponse[]> {
    return this.api.get<ListaNegraResponse[]>('/lista-negra');
  }

  agregar(request: ListaNegraRequest): Observable<ListaNegraResponse> {
    return this.api.post<ListaNegraResponse>('/lista-negra', request);
  }

  desactivar(id: number): Observable<ListaNegraResponse> {
    return this.api.patch<ListaNegraResponse>(`/lista-negra/${id}/desactivar`);
  }
}
