import { TipoPrograma } from './programa.model';
import { Genero, NivelEducativo } from './usuario.model';

/**
 * Filtros del reporte de beneficiarios. No incluye "estado": el reporte
 * siempre son personas ACEPTADAS en programas ya finalizados — eso no se
 * filtra, es la definición del reporte. fechaDesde/fechaHasta acotan la
 * fecha en que el programa finalizó.
 */
export interface ReporteFiltro {
  tipoPrograma?: TipoPrograma | null;
  idPrograma?: number | null;
  genero?: Genero | null;
  nivelEducativo?: NivelEducativo | null;
  idPais?: number | null;
  idCiudad?: number | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
}

export interface BeneficiarioReporte {
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
  fechaFinPrograma: string;
}
