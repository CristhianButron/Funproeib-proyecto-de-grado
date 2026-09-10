import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DocumentoRequest, DocumentoResponse, ReqDocumentoResponse } from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  constructor(private api: ApiService, private http: HttpClient) {}

  listarRequisitos(idPrograma: number): Observable<ReqDocumentoResponse[]> {
    return this.api.get<ReqDocumentoResponse[]>(`/req-documentos/programa/${idPrograma}`);
  }

  listarPorPostulacion(idPostulacion: number): Observable<DocumentoResponse[]> {
    return this.api.get<DocumentoResponse[]>(`/documentos/postulacion/${idPostulacion}`);
  }

  registrar(request: DocumentoRequest): Observable<DocumentoResponse> {
    return this.api.post<DocumentoResponse>('/documentos', request);
  }

  subirArchivo(idPostulacion: number, idReqDocumento: number, archivo: File): Observable<DocumentoResponse> {
    const formData = new FormData();
    formData.append('idPostulacion', String(idPostulacion));
    formData.append('idReqDocumento', String(idReqDocumento));
    formData.append('archivo', archivo);
    return this.http.post<DocumentoResponse>(`${this.api.base}/documentos/subir`, formData);
  }

  /** URL para ver/descargar el archivo de un documento cargado. */
  urlArchivo(idDocumento: number): string {
    return `${this.api.base}/documentos/${idDocumento}/archivo`;
  }

  verificar(idDocumento: number): Observable<DocumentoResponse> {
    return this.api.patch<DocumentoResponse>(`/documentos/${idDocumento}/verificar`);
  }
}
