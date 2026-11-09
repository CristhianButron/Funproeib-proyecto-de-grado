import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CriterioEvaluacionRequest, CriterioEvaluacionResponse } from '../models/evaluacion.model';

@Injectable({ providedIn: 'root' })
export class CriterioService {
  constructor(private api: ApiService) {}

  listarTodos(): Observable<CriterioEvaluacionResponse[]> {
    return this.api.get<CriterioEvaluacionResponse[]>('/criterios');
  }

  listarActivos(): Observable<CriterioEvaluacionResponse[]> {
    return this.api.get<CriterioEvaluacionResponse[]>('/criterios/activos');
  }

  crear(request: CriterioEvaluacionRequest): Observable<CriterioEvaluacionResponse> {
    return this.api.post<CriterioEvaluacionResponse>('/criterios', request);
  }

  actualizar(id: number, request: CriterioEvaluacionRequest): Observable<CriterioEvaluacionResponse> {
    return this.api.put<CriterioEvaluacionResponse>(`/criterios/${id}`, request);
  }

  cambiarActivo(id: number, activo: boolean): Observable<CriterioEvaluacionResponse> {
    return this.api.patch<CriterioEvaluacionResponse>(`/criterios/${id}/activo`, { activo: String(activo) });
  }
}
