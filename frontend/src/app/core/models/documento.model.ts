export type TipoDocumento = 'PDF' | 'ENLACE';

export interface ReqDocumentoRequest {
  idPrograma: number;
  nombreDocumento: string;
  descripcion?: string;
  obligatorio: boolean;
  tipoPermitido: TipoDocumento;
}

export interface ReqDocumentoResponse {
  id: number;
  idPrograma: number;
  nombrePrograma: string;
  nombreDocumento: string;
  descripcion?: string;
  obligatorio: boolean;
  tipoPermitido: TipoDocumento;
}

export interface DocumentoRequest {
  idPostulacion: number;
  idReqDocumento: number;
  rutaArchivo: string;
  tipo: TipoDocumento;
}

export interface DocumentoResponse {
  id: number;
  idPostulacion: number;
  idReqDocumento: number;
  nombreReqDocumento: string;
  rutaArchivo: string;
  tipo: TipoDocumento;
  fechaCarga: string;
  verificado: boolean;
}
