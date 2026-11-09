import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CriterioService } from '../../core/services/criterio.service';
import { CriterioEvaluacionResponse } from '../../core/models/evaluacion.model';

@Component({
  selector: 'app-criterios-admin',
  imports: [FormsModule],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Criterios de evaluación</h1>
      <p class="text-on-surface-variant">Catálogo de criterios con los que el evaluador califica cada postulación. El puntaje de la evaluación siempre se ajusta para sumar 100, sin importar cuántos criterios estén activos.</p>
    </div>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <div class="bg-primary-fixed text-primary rounded-xl p-4 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined">calculate</span>
      <p class="text-sm font-semibold">
        Hay <b>{{ activos().length }}</b> criterio(s) activo(s). Cada uno vale hasta
        <b>{{ valorPorCriterio() }}</b> puntos de los 100 totales.
      </p>
    </div>

    <!-- Agregar -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6">
      <p class="font-bold text-on-surface mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-primary">add_circle</span> Agregar criterio</p>
      <div class="grid sm:grid-cols-3 gap-3">
        <div class="sm:col-span-1">
          <label class="block text-xs font-semibold mb-1">Nombre *</label>
          <input [(ngModel)]="nuevo.nombreCriterio" class="campo" placeholder="Ej: Trabajo en equipo" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold mb-1">Descripción</label>
          <input [(ngModel)]="nuevo.descripcion" class="campo" placeholder="Opcional: qué evalúa este criterio" />
        </div>
      </div>
      <button (click)="agregar()" [disabled]="guardando()" class="mt-3 px-5 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50">
        Agregar criterio
      </button>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
      @if (cargando()) {
        <p class="p-6 text-on-surface-variant">Cargando...</p>
      } @else {
        <table class="w-full text-left">
          <thead class="bg-surface-low">
            <tr>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase w-12">#</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Criterio</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            @for (c of criterios(); track c.id) {
              <tr class="hover:bg-surface-low transition-colors" [class.opacity-50]="!c.activo">
                <td class="px-6 py-4 text-sm text-on-surface-variant">{{ c.orden }}</td>
                <td class="px-6 py-4">
                  @if (editandoId() === c.id) {
                    <input [(ngModel)]="edicion.nombreCriterio" class="campo mb-1" placeholder="Nombre" />
                    <input [(ngModel)]="edicion.descripcion" class="campo" placeholder="Descripción (opcional)" />
                  } @else {
                    <p class="font-semibold text-sm text-primary">{{ c.nombreCriterio }}</p>
                    @if (c.descripcion) { <p class="text-xs text-on-surface-variant mt-0.5">{{ c.descripcion }}</p> }
                    @if (!c.activo) { <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface-high text-on-surface-variant">Inactivo</span> }
                  }
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  @if (editandoId() === c.id) {
                    <button (click)="guardarEdicion(c)" [disabled]="guardando()" class="px-3 py-1.5 rounded-lg text-white bg-primary hover:bg-primary-dark text-sm font-semibold mr-1">Guardar</button>
                    <button (click)="cancelarEdicion()" class="px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-low text-sm font-semibold">Cancelar</button>
                  } @else {
                    <button (click)="iniciarEdicion(c)" class="px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed text-sm font-semibold mr-1">Editar</button>
                    @if (c.activo) {
                      <button (click)="desactivar(c)" class="px-3 py-1.5 rounded-lg text-error hover:bg-error-container text-sm font-semibold">Desactivar</button>
                    } @else {
                      <button (click)="activar(c)" class="px-3 py-1.5 rounded-lg text-secondary hover:bg-secondary-light text-sm font-semibold">Reactivar</button>
                    }
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="px-6 py-10 text-center text-on-surface-variant">No hay criterios registrados.</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
  `],
})
export class CriteriosAdminComponent implements OnInit {
  criterios = signal<CriterioEvaluacionResponse[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  nuevo = { nombreCriterio: '', descripcion: '' };

  editandoId = signal<number | null>(null);
  edicion = { nombreCriterio: '', descripcion: '' };

  activos = computed(() => this.criterios().filter(c => c.activo));
  valorPorCriterio = computed(() => {
    const n = this.activos().length;
    return n > 0 ? (100 / n).toFixed(2) : '0.00';
  });

  constructor(private criterioService: CriterioService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.criterioService.listarTodos().subscribe({
      next: (d) => { this.criterios.set(d); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.notificar('Error al cargar los criterios. Verifica que el servidor esté corriendo.', true); },
    });
  }

  agregar(): void {
    if (!this.nuevo.nombreCriterio.trim()) { this.notificar('Ingresa el nombre del criterio', true); return; }
    this.guardando.set(true);
    this.criterioService.crear({
      nombreCriterio: this.nuevo.nombreCriterio.trim(),
      descripcion: this.nuevo.descripcion.trim() || undefined,
    }).subscribe({
      next: (c) => {
        this.guardando.set(false);
        this.criterios.update(l => [...l, c]);
        this.nuevo = { nombreCriterio: '', descripcion: '' };
        this.notificar(`Criterio agregado. Ahora cada criterio activo vale ${this.valorPorCriterio()} puntos.`, false);
      },
      error: (err) => { this.guardando.set(false); this.notificar(err.error?.mensaje || 'Error al agregar el criterio', true); },
    });
  }

  iniciarEdicion(c: CriterioEvaluacionResponse): void {
    this.editandoId.set(c.id);
    this.edicion = { nombreCriterio: c.nombreCriterio, descripcion: c.descripcion ?? '' };
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  guardarEdicion(c: CriterioEvaluacionResponse): void {
    if (!this.edicion.nombreCriterio.trim()) { this.notificar('El nombre no puede quedar vacío', true); return; }
    this.guardando.set(true);
    this.criterioService.actualizar(c.id, {
      nombreCriterio: this.edicion.nombreCriterio.trim(),
      descripcion: this.edicion.descripcion.trim() || undefined,
    }).subscribe({
      next: (actualizado) => {
        this.guardando.set(false);
        this.criterios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.editandoId.set(null);
        this.notificar('Criterio actualizado', false);
      },
      error: (err) => { this.guardando.set(false); this.notificar(err.error?.mensaje || 'Error al actualizar el criterio', true); },
    });
  }

  desactivar(c: CriterioEvaluacionResponse): void {
    this.criterioService.cambiarActivo(c.id, false).subscribe({
      next: (actualizado) => {
        this.criterios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.notificar(`Criterio desactivado. Ahora cada criterio activo vale ${this.valorPorCriterio()} puntos.`, false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al desactivar el criterio', true),
    });
  }

  activar(c: CriterioEvaluacionResponse): void {
    this.criterioService.cambiarActivo(c.id, true).subscribe({
      next: (actualizado) => {
        this.criterios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.notificar(`Criterio reactivado. Ahora cada criterio activo vale ${this.valorPorCriterio()} puntos.`, false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al reactivar el criterio', true),
    });
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4500);
  }
}
