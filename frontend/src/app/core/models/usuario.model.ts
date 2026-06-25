export type RolUsuario = 'POSTULANTE' | 'ADMIN' | 'EVALUADOR';
export type Genero = 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_INDICAR';
export type NivelEducativo = 'SECUNDARIA' | 'TECNICO_MEDIO' | 'TECNICO_SUPERIOR' | 'LICENCIATURA' | 'ESPECIALIZACION' | 'MAESTRIA' | 'DOCTORADO';

export interface UsuarioRegistroRequest {
  nombreCompleto: string;
  correo: string;
  contrasena: string;
  ci: string;
  genero: Genero;
  fechaNacimiento: string;
  autoidentificacionEtnica?: string;
  nivelEducativo: NivelEducativo;
  paisOrigen: string;
  departamentoOrigen?: string;
  municipioOrigen?: string;
  telefono?: string;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface UsuarioResponse {
  id: number;
  nombreCompleto: string;
  correo: string;
  ci: string;
  rol: RolUsuario;
  fechaRegistro: string;
  activo: boolean;
  genero: Genero;
  fechaNacimiento: string;
  edad: number;
  autoidentificacionEtnica?: string;
  nivelEducativo: NivelEducativo;
  paisOrigen: string;
  departamentoOrigen?: string;
  municipioOrigen?: string;
  telefono?: string;
}
