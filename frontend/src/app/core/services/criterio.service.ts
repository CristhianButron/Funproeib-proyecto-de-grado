import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CriterioEvaluacionRequest } from '../models/criterio.model';
import { CriterioEvaluacionResponse } from '../models/evaluacion.model';

@Injectable({ providedIn: 'root' })
export class CriterioService {
  constructor(private api: ApiService) {}

  listarPorPrograma(idPrograma: number): Observable<CriterioEvaluacionResponse[]> {
    return this.api.get<CriterioEvaluacionResponse[]>(`/criterios/programa/${idPrograma}`);
  }

  crear(request: CriterioEvaluacionRequest): Observable<CriterioEvaluacionResponse> {
    return this.api.post<CriterioEvaluacionResponse>('/criterios', request);
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`/criterios/${id}`);
  }
}
