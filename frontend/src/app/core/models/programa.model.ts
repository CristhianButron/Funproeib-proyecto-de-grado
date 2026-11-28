export type TipoPrograma = 'DIPLOMADO' | 'CURSO' | 'TALLER';
export type EstadoPrograma = 'BORRADOR' | 'ACTIVO' | 'ABIERTO' | 'CERRADO';

export interface ProgramaRequest {
  nombre: string;
  tipo: TipoPrograma;
  edicion?: string;
  fechaInicio: string;
  fechaFin: string;
  cuposDisponibles: number;
  descripcion?: string;
  modulos?: string[];
}

export interface ProgramaResponse {
  id: number;
  nombre: string;
  tipo: TipoPrograma;
  edicion?: string;
  fechaInicio: string;
  fechaFin: string;
  cuposDisponibles: number;
  estado: EstadoPrograma;
  descripcion?: string;
  modulos: string[];
}
