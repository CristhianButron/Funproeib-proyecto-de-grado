import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

/** Montado una sola vez en la raíz de la app (ver app.ts). */
@Component({
  selector: 'app-confirm-dialog',
  template: `
  @if (servicio.solicitud(); as s) {
    <div class="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" (click)="servicio.resolver(false)">
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden" (click)="$event.stopPropagation()">
        <div class="p-6 space-y-3">
          <h2 class="font-bold text-lg flex items-center gap-2" [class]="s.peligroso ? 'text-error' : 'text-primary-dark'">
            <span class="material-symbols-outlined">{{ s.peligroso ? 'warning' : 'help' }}</span>
            {{ s.titulo }}
          </h2>
          <p class="text-sm text-on-surface-variant whitespace-pre-line">{{ s.mensaje }}</p>
        </div>
        <div class="flex justify-end gap-2 px-6 py-4 bg-surface-low">
          <button type="button" (click)="servicio.resolver(false)"
            class="px-4 py-2 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-high transition-colors">
            {{ s.textoCancelar ?? 'Cancelar' }}
          </button>
          <button type="button" (click)="servicio.resolver(true)"
            class="px-4 py-2 rounded-lg font-bold text-white transition-colors"
            [class]="s.peligroso ? 'bg-error hover:opacity-90' : 'bg-primary hover:bg-primary-dark'">
            {{ s.textoConfirmar ?? 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  }
  `,
})
export class ConfirmDialogComponent {
  servicio = inject(ConfirmDialogService);
}
