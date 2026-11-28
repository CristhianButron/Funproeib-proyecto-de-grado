import { NivelEducativo } from '../models/usuario.model';

/** Solo quien cursó/cursa secundaria puede no tener carrera todavía. */
export function requiereCarrera(nivel: NivelEducativo | string | null | undefined): boolean {
  return !!nivel && nivel !== 'SECUNDARIA';
}
