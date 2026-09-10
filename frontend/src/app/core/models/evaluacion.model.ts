export interface CriterioEvaluacionResponse {
  id: number;
  orden: number;
  nombreCriterio: string;
  descripcion?: string;
}

export interface DetalleEvaluacionResponse {
  id: number;
  idCriterio: number;
  nombreCriterio: string;
  puntaje: number;
}

export interface EvaluacionResponse {
  id: number;
  idPostulacion: number;
  nombrePostulante: string;
  idEvaluador: number;
  nombreEvaluador: string;
  fechaEvaluacion: string;
  puntajeTotal: number;
  puntajeMaximo: number;
  observaciones?: string;
  detalles: DetalleEvaluacionResponse[];
}
