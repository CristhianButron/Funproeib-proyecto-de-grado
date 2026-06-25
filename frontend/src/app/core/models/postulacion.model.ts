export type EstadoPostulacion = 'INCOMPLETA' | 'PENDIENTE' | 'EVALUADA' | 'ACEPTADA' | 'RECHAZADA' | 'BLOQUEADA';

export interface PostulacionRequest {
  idUsuario: number;
  idPrograma: number;
}

export interface PostulacionResponse {
  id: number;
  idUsuario: number;
  nombrePostulante: string;
  idPrograma: number;
  nombrePrograma: string;
  fechaPostulacion: string;
  estado: EstadoPostulacion;
}
