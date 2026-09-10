export type RolUsuario = 'POSTULANTE' | 'ADMIN' | 'EVALUADOR';
export type Genero = 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_INDICAR';
export type NivelEducativo = 'SECUNDARIA' | 'TECNICO_MEDIO' | 'TECNICO_SUPERIOR' | 'LICENCIATURA' | 'ESPECIALIZACION' | 'MAESTRIA' | 'DOCTORADO';
export type EstadoCivil = 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'UNION_LIBRE';

export interface UsuarioRegistroRequest {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  correo: string;
  contrasena: string;
  ci: string;
  genero: Genero;
  fechaNacimiento: string;
  autoidentificacionEtnica?: string;
  nivelEducativo: NivelEducativo;
  idCiudad: number;
  telefono?: string;
  estadoCivil: EstadoCivil;
  idCiudadNacimiento: number;
  provinciaNacimiento?: string;
  direccionDomicilio?: string;
  carreras?: string[];
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
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
  idCiudad?: number;
  ciudad?: string;
  idPais?: number;
  pais?: string;
  telefono?: string;
  estadoCivil?: EstadoCivil;
  idCiudadNacimiento?: number;
  ciudadNacimiento?: string;
  idPaisNacimiento?: number;
  paisNacimiento?: string;
  provinciaNacimiento?: string;
  direccionDomicilio?: string;
  carreras?: string[];
}
