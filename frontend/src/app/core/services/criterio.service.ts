import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CriterioEvaluacionResponse } from '../models/evaluacion.model';

@Injectable({ providedIn: 'root' })
export class CriterioService {
  constructor(private api: ApiService) {}

  listarTodos(): Observable<CriterioEvaluacionResponse[]> {
    return this.api.get<CriterioEvaluacionResponse[]>('/criterios');
  }
}
