export interface CriterioEvaluacionResponse {
  id: number;
  idPrograma: number;
  nombrePrograma: string;
  nombreCriterio: string;
  descripcion?: string;
  peso: number;
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
  observaciones?: string;
  detalles: DetalleEvaluacionResponse[];
}
