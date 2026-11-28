import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

/** Montado una sola vez en la raíz de la app (ver app.ts). */
@Component({
  selector: 'app-toast',
  template: `
  @if (toast.mensaje(); as m) {
    <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="toast.esError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
      <span class="material-symbols-outlined text-[20px]">{{ toast.esError() ? 'error' : 'check_circle' }}</span>
      <span class="flex-1">{{ m }}</span>
      <button type="button" (click)="toast.cerrar()" class="shrink-0 opacity-70 hover:opacity-100">
        <span class="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  }
  `,
})
export class ToastComponent {
  toast = inject(ToastService);
}
