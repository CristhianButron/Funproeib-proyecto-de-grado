import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DocumentoRequest, DocumentoResponse, ReqDocumentoResponse } from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  constructor(private api: ApiService) {}

  listarRequisitos(idPrograma: number): Observable<ReqDocumentoResponse[]> {
    return this.api.get<ReqDocumentoResponse[]>(`/req-documentos/programa/${idPrograma}`);
  }

  listarPorPostulacion(idPostulacion: number): Observable<DocumentoResponse[]> {
    return this.api.get<DocumentoResponse[]>(`/documentos/postulacion/${idPostulacion}`);
  }

  registrar(request: DocumentoRequest): Observable<DocumentoResponse> {
    return this.api.post<DocumentoResponse>('/documentos', request);
  }

  verificar(idDocumento: number): Observable<DocumentoResponse> {
    return this.api.patch<DocumentoResponse>(`/documentos/${idDocumento}/verificar`);
  }
}
