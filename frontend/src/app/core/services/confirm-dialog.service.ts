import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Resalta el diálogo en rojo (acciones destructivas: eliminar, rechazar). */
  peligroso?: boolean;
}

interface SolicitudConfirmacion extends ConfirmDialogOptions {
  resolver: (confirmado: boolean) => void;
}

/**
 * Reemplaza a window.confirm(): un modal propio (ver ConfirmDialogComponent,
 * montado una sola vez en el componente raíz) en vez del diálogo nativo del
 * navegador, que rompía la estética del resto del sistema.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly solicitud = signal<SolicitudConfirmacion | null>(null);

  confirmar(opciones: ConfirmDialogOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.solicitud.set({ ...opciones, resolver: resolve });
    });
  }

  resolver(confirmado: boolean): void {
    this.solicitud()?.resolver(confirmado);
    this.solicitud.set(null);
  }
}
