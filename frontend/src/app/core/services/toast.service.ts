import { Injectable, signal } from '@angular/core';

const DURACION_DEFECTO_MS = 4000;

/**
 * Notificación flotante compartida (ver ToastComponent, montado una sola vez
 * en el componente raíz) en vez de que cada página mantenga su propia señal
 * de mensaje + temporizador.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly mensaje = signal<string | null>(null);
  readonly esError = signal(false);

  private idTimeout: ReturnType<typeof setTimeout> | null = null;

  notificar(mensaje: string, esError = false, duracionMs = DURACION_DEFECTO_MS): void {
    if (this.idTimeout !== null) {
      clearTimeout(this.idTimeout);
    }
    this.mensaje.set(mensaje);
    this.esError.set(esError);
    this.idTimeout = setTimeout(() => this.mensaje.set(null), duracionMs);
  }

  cerrar(): void {
    this.mensaje.set(null);
  }
}
