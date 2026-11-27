import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface OpcionBuscable {
  id: number;
  nombre: string;
}

/**
 * Select con buscador para listas largas (ciudades, países, programas...),
 * donde desplazarse por un <select> nativo con cientos de opciones es poco
 * práctico. No usa ControlValueAccessor a propósito: se integra con el
 * patrón que ya usan estas pantallas ([valor] + (cambio)), no con ngModel.
 */
@Component({
  selector: 'app-select-buscable',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="relative">
    <button type="button" (click)="alternar()" [disabled]="disabled"
      class="campo w-full text-left flex items-center justify-between gap-2 disabled:bg-surface-high disabled:text-on-surface-variant disabled:cursor-not-allowed">
      <span class="truncate" [class.text-on-surface-variant]="!etiquetaSeleccionada()">{{ etiquetaSeleccionada() || placeholder }}</span>
      <span class="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">{{ abierto() ? 'expand_less' : 'expand_more' }}</span>
    </button>

    @if (abierto()) {
      <div class="absolute z-20 mt-1 w-full bg-white border border-outline-variant rounded-lg shadow-xl overflow-hidden">
        <div class="p-2 border-b border-outline-variant">
          <input [(ngModel)]="filtro" [attr.aria-label]="'Buscar en ' + placeholder" autocomplete="off"
            placeholder="Buscar..." class="w-full px-2 py-1.5 text-sm border border-outline-variant rounded-md outline-none focus:border-primary" />
        </div>
        <div class="max-h-56 overflow-y-auto">
          @for (op of opcionesFiltradas(); track op.id) {
            <button type="button" (click)="seleccionar(op)"
              class="w-full text-left px-3 py-2 text-sm hover:bg-surface-low transition-colors"
              [class.bg-primary-fixed]="op.id === valor">
              {{ op.nombre }}
            </button>
          } @empty {
            <p class="px-3 py-4 text-sm text-on-surface-variant text-center">Sin resultados</p>
          }
        </div>
      </div>
    }
  </div>
  `,
})
export class SelectBuscableComponent {
  @Input() opciones: OpcionBuscable[] = [];
  @Input() valor: number | null = null;
  @Input() placeholder = 'Seleccione...';
  @Input() disabled = false;
  @Output() cambio = new EventEmitter<number | null>();

  abierto = signal(false);
  filtro = '';

  private elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  cerrarSiEsFuera(event: MouseEvent): void {
    if (this.abierto() && !this.elementRef.nativeElement.contains(event.target)) {
      this.abierto.set(false);
    }
  }

  etiquetaSeleccionada(): string | null {
    return this.opciones.find(o => o.id === this.valor)?.nombre ?? null;
  }

  opcionesFiltradas(): OpcionBuscable[] {
    const texto = this.filtro.trim().toLowerCase();
    if (!texto) return this.opciones;
    return this.opciones.filter(o => o.nombre.toLowerCase().includes(texto));
  }

  alternar(): void {
    if (this.disabled) return;
    const nuevoEstado = !this.abierto();
    this.abierto.set(nuevoEstado);
    if (nuevoEstado) this.filtro = '';
  }

  seleccionar(op: OpcionBuscable): void {
    this.cambio.emit(op.id);
    this.abierto.set(false);
  }
}
