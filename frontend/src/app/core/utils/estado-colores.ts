import { EstadoAprovechamiento, EstadoPostulacion } from '../models/postulacion.model';
import { EstadoPrograma } from '../models/programa.model';

const BADGE_POSTULACION: Record<EstadoPostulacion, string> = {
  INCOMPLETA: 'bg-surface-high text-on-surface-variant',
  PENDIENTE: 'bg-amber-100 text-amber-800',
  EVALUADA: 'bg-blue-100 text-blue-800',
  ACEPTADA: 'bg-secondary-light text-on-secondary-container',
  RECHAZADA: 'bg-error-container text-on-error-container',
  BLOQUEADA: 'bg-on-surface text-white',
};
export function badgePostulacion(estado: string): string {
  return BADGE_POSTULACION[estado as EstadoPostulacion] ?? 'bg-surface-high text-on-surface-variant';
}

const BORDE_POSTULACION: Record<EstadoPostulacion, string> = {
  INCOMPLETA: 'border-outline-variant',
  PENDIENTE: 'border-amber-500',
  EVALUADA: 'border-blue-500',
  ACEPTADA: 'border-secondary',
  RECHAZADA: 'border-error',
  BLOQUEADA: 'border-on-surface',
};
export function colorBordePostulacion(estado: string): string {
  return BORDE_POSTULACION[estado as EstadoPostulacion] ?? 'border-outline-variant';
}

const TEXTO_POSTULACION: Record<EstadoPostulacion, string> = {
  INCOMPLETA: 'text-on-surface-variant',
  PENDIENTE: 'text-amber-700',
  EVALUADA: 'text-blue-700',
  ACEPTADA: 'text-secondary',
  RECHAZADA: 'text-error',
  BLOQUEADA: 'text-on-surface',
};
export function colorTextoPostulacion(estado: string): string {
  return TEXTO_POSTULACION[estado as EstadoPostulacion] ?? 'text-on-surface-variant';
}

const ICONO_POSTULACION: Record<EstadoPostulacion, string> = {
  INCOMPLETA: 'edit_note',
  PENDIENTE: 'hourglass_top',
  EVALUADA: 'fact_check',
  ACEPTADA: 'check_circle',
  RECHAZADA: 'cancel',
  BLOQUEADA: 'block',
};
export function iconoPostulacion(estado: string): string {
  return ICONO_POSTULACION[estado as EstadoPostulacion] ?? 'help';
}

const BADGE_APROVECHAMIENTO: Record<EstadoAprovechamiento, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  APROBADO: 'bg-secondary-light text-on-secondary-container',
  REPROBADO: 'bg-error-container text-on-error-container',
  ABANDONO: 'bg-orange-100 text-orange-800',
};
export function badgeAprovechamiento(estado: string): string {
  return BADGE_APROVECHAMIENTO[estado as EstadoAprovechamiento] ?? 'bg-surface-high text-on-surface-variant';
}

const BORDE_APROVECHAMIENTO: Record<EstadoAprovechamiento, string> = {
  PENDIENTE: 'border-amber-500',
  APROBADO: 'border-secondary',
  REPROBADO: 'border-error',
  ABANDONO: 'border-orange-500',
};
export function colorBordeAprovechamiento(estado: string): string {
  return BORDE_APROVECHAMIENTO[estado as EstadoAprovechamiento] ?? 'border-outline-variant';
}

const TEXTO_APROVECHAMIENTO: Record<EstadoAprovechamiento, string> = {
  PENDIENTE: 'text-amber-700',
  APROBADO: 'text-secondary',
  REPROBADO: 'text-error',
  ABANDONO: 'text-orange-700',
};
export function colorTextoAprovechamiento(estado: string): string {
  return TEXTO_APROVECHAMIENTO[estado as EstadoAprovechamiento] ?? 'text-on-surface-variant';
}

const BADGE_PROGRAMA: Record<EstadoPrograma, string> = {
  BORRADOR: 'bg-surface-high text-on-surface-variant',
  ACTIVO: 'bg-primary-fixed text-primary',
  ABIERTO: 'bg-secondary-light text-on-secondary-container',
  CERRADO: 'bg-error-container text-on-error-container',
};
export function badgePrograma(estado: string): string {
  return BADGE_PROGRAMA[estado as EstadoPrograma] ?? 'bg-surface-high text-on-surface-variant';
}

const BORDE_PROGRAMA: Record<EstadoPrograma, string> = {
  BORRADOR: 'border-outline-variant',
  ACTIVO: 'border-primary',
  ABIERTO: 'border-secondary',
  CERRADO: 'border-error',
};
export function colorBordePrograma(estado: string): string {
  return BORDE_PROGRAMA[estado as EstadoPrograma] ?? 'border-outline-variant';
}

const TEXTO_PROGRAMA: Record<EstadoPrograma, string> = {
  BORRADOR: 'text-on-surface-variant',
  ACTIVO: 'text-primary',
  ABIERTO: 'text-secondary',
  CERRADO: 'text-error',
};
export function colorTextoPrograma(estado: string): string {
  return TEXTO_PROGRAMA[estado as EstadoPrograma] ?? 'text-on-surface-variant';
}
