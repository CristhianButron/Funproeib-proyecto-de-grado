import { EstadoPostulacion } from './postulacion.model';
import { TipoPrograma } from './programa.model';
import { Genero, NivelEducativo } from './usuario.model';

export interface ReporteFiltro {
  tipoPrograma?: TipoPrograma | null;
  idPrograma?: number | null;
  estado?: EstadoPostulacion | null;
  genero?: Genero | null;
  nivelEducativo?: NivelEducativo | null;
  idPais?: number | null;
  idCiudad?: number | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
}

export interface InscritoReporte {
  idPostulacion: number;
  idUsuario: number;
  nombreCompleto: string;
  ci: string;
  correo: string;
  telefono?: string;
  genero: Genero;
  edad?: number;
  fechaNacimiento?: string;
  nivelEducativo: NivelEducativo;
  autoidentificacionEtnica?: string;
  pais?: string;
  ciudad?: string;
  idPrograma: number;
  nombrePrograma: string;
  tipoPrograma: TipoPrograma;
  edicion?: string;
  fechaPostulacion: string;
  estado: EstadoPostulacion;
}
