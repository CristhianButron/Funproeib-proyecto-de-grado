import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ProgramaRequest, ProgramaResponse } from '../models/programa.model';

@Injectable({ providedIn: 'root' })
export class ProgramaService {
  constructor(private api: ApiService) {}

  listarTodos(): Observable<ProgramaResponse[]> {
    return this.api.get<ProgramaResponse[]>('/programas');
  }

  obtenerPorId(id: number): Observable<ProgramaResponse> {
    return this.api.get<ProgramaResponse>(`/programas/${id}`);
  }

  crear(request: ProgramaRequest): Observable<ProgramaResponse> {
    return this.api.post<ProgramaResponse>('/programas', request);
  }

  actualizar(id: number, request: ProgramaRequest): Observable<ProgramaResponse> {
    return this.api.put<ProgramaResponse>(`/programas/${id}`, request);
  }

  cambiarEstado(id: number, estado: string): Observable<ProgramaResponse> {
    return this.api.patch<ProgramaResponse>(`/programas/${id}/estado`, { estado });
  }
}
