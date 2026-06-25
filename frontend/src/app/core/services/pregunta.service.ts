import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PreguntaRequest, PreguntaResponse, RespuestaRequest, RespuestaResponse } from '../models/pregunta.model';

@Injectable({ providedIn: 'root' })
export class PreguntaService {
  constructor(private api: ApiService) {}

  listarPorPrograma(idPrograma: number): Observable<PreguntaResponse[]> {
    return this.api.get<PreguntaResponse[]>(`/preguntas/programa/${idPrograma}`);
  }

  crear(request: PreguntaRequest): Observable<PreguntaResponse> {
    return this.api.post<PreguntaResponse>('/preguntas', request);
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`/preguntas/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class RespuestaService {
  constructor(private api: ApiService) {}

  listarPorPostulacion(idPostulacion: number): Observable<RespuestaResponse[]> {
    return this.api.get<RespuestaResponse[]>(`/respuestas/postulacion/${idPostulacion}`);
  }

  guardar(request: RespuestaRequest): Observable<RespuestaResponse> {
    return this.api.post<RespuestaResponse>('/respuestas', request);
  }
}
