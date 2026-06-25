import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { EvaluacionRequest } from '../models/criterio.model';
import { EvaluacionResponse } from '../models/evaluacion.model';

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  constructor(private api: ApiService) {}

  evaluar(request: EvaluacionRequest): Observable<EvaluacionResponse> {
    return this.api.post<EvaluacionResponse>('/evaluaciones', request);
  }

  obtenerPorPostulacion(idPostulacion: number): Observable<EvaluacionResponse> {
    return this.api.get<EvaluacionResponse>(`/evaluaciones/postulacion/${idPostulacion}`);
  }
}
