export interface DetalleEvaluacionRequest {
  idCriterio: number;
  puntaje: number;
}

export interface EvaluacionRequest {
  idPostulacion: number;
  idEvaluador: number;
  observaciones?: string;
  detalles: DetalleEvaluacionRequest[];
}
