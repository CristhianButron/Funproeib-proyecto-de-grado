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

  // Este endpoint exige el JWT de quien pide el archivo (ver DocumentoController
  // y RecursoAuthService en el backend); un <a href> normal del navegador no
  // manda ese header, así que hay que pedirlo por HttpClient (que el
  // interceptor sí intercepta) y abrir el blob resultante.
  obtenerArchivo(idDocumento: number): Observable<Blob> {
    return this.api.getBlob(`/documentos/${idDocumento}/archivo`);
  }

  verificar(idDocumento: number): Observable<DocumentoResponse> {
    return this.api.patch<DocumentoResponse>(`/documentos/${idDocumento}/verificar`);
  }
}
