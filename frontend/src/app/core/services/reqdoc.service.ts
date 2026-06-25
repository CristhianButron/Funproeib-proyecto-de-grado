import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ReqDocumentoRequest, ReqDocumentoResponse } from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class ReqDocumentoService {
  constructor(private api: ApiService) {}

  listarPorPrograma(idPrograma: number): Observable<ReqDocumentoResponse[]> {
    return this.api.get<ReqDocumentoResponse[]>(`/req-documentos/programa/${idPrograma}`);
  }

  crear(request: ReqDocumentoRequest): Observable<ReqDocumentoResponse> {
    return this.api.post<ReqDocumentoResponse>('/req-documentos', request);
  }
}
