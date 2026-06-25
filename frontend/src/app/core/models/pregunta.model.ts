export interface PreguntaRequest {
  idPrograma: number;
  enunciado: string;
  orden?: number;
}

export interface PreguntaResponse {
  id: number;
  idPrograma: number;
  enunciado: string;
  orden: number;
}

export interface RespuestaRequest {
  idPostulacion: number;
  idPregunta: number;
  respuesta: string;
}

export interface RespuestaResponse {
  id: number;
  idPregunta: number;
  enunciado: string;
  respuesta: string;
}
