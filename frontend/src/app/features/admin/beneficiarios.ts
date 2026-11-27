import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { SelectBuscableComponent } from '../../core/components/select-buscable.component';
import { ProgramaResponse } from '../../core/models/programa.model';
import { PostulacionResponse, EstadoAprovechamiento } from '../../core/models/postulacion.model';

const LABEL_APROVECHAMIENTO: Record<EstadoAprovechamiento, string> = {
  PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', REPROBADO: 'Reprobado', ABANDONO: 'Abandono',
};

/**
 * A diferencia de "Postulantes" (que solo maneja el trámite de la
 * postulación: aceptar/rechazar) y de "Reportes" (de solo lectura), acá se
 * registra el estado final de cada BENEFICIARIO (postulante ya aceptado) una
 * vez que termina el programa: Aprobado, Reprobado o Abandono. Lo pueden usar
 * tanto ADMIN como EVALUADOR.
 */
@Component({
  selector: 'app-beneficiarios',
  imports: [FormsModule, RouterLink, SelectBuscableComponent],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Beneficiarios</h1>
      <p class="text-on-surface-variant">Registra el estado final de los postulantes aceptados en cada programa.</p>
    </div>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6 flex flex-wrap items-center gap-3">
      <span class="material-symbols-outlined text-primary">filter_alt</span>
      <div class="max-w-md flex-1 min-w-[220px]">
        <app-select-buscable [opciones]="opcionesPrograma()" [valor]="programaSel" placeholder="Seleccione un programa..."
          (cambio)="onProgramaChange($event)" />
      </div>
      @if (programaSel) {
        <div class="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <span class="material-symbols-outlined text-on-surface-variant">search</span>
          <input [(ngModel)]="busqueda" class="campo" placeholder="Buscar beneficiario por nombre..." />
        </div>
      }
    </div>

    @if (!programaSel) {
      <div class="text-center py-20 bg-white rounded-xl border border-outline-variant text-on-surface-variant">
        <span class="material-symbols-outlined text-5xl text-outline-variant">workspace_premium</span>
        <p class="mt-3 font-semibold text-on-surface">Selecciona un programa para ver a sus beneficiarios</p>
        <p class="text-sm mt-1">Usa el filtro de arriba para elegir una convocatoria.</p>
      </div>
    } @else {
      <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
        @if (cargando()) {
          <p class="p-6 text-on-surface-variant">Cargando...</p>
        } @else {
          <p class="px-6 pt-4 text-xs text-on-surface-variant">
            Abandono se puede marcar en cualquier momento. Aprobado/Reprobado solo una vez que el programa finalice{{ programaYaFinalizo() ? '' : ' (' + fechaFinProgramaSel() + ')' }}.
          </p>
          <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-surface-low">
              <tr>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Beneficiario</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Fecha de postulación</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Estado final</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (b of beneficiariosFiltrados(); track b.id) {
                <tr class="hover:bg-surface-low transition-colors">
                  <td class="px-6 py-4 font-semibold text-primary">{{ b.nombrePostulante }}</td>
                  <td class="px-6 py-4 text-sm">{{ b.fechaPostulacion }}</td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-2">
                      @for (e of estadosAprovechamiento; track e) {
                        <button (click)="actualizarAprovechamiento(b, e)"
                          [disabled]="!programaYaFinalizo() && (e === 'APROBADO' || e === 'REPROBADO')"
                          class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          [class]="b.estadoAprovechamiento === e ? badge(e) + ' border-transparent' : 'border-outline-variant text-on-surface-variant hover:bg-surface-low'">
                          {{ LABEL_APROVECHAMIENTO[e] }}
                        </button>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <a [routerLink]="['../beneficiarios', b.id]" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors text-sm font-semibold">
                      <span class="material-symbols-outlined text-[18px]">badge</span> Ver ficha
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="px-6 py-10 text-center text-on-surface-variant">
                  @if (busqueda.trim()) {
                    Ningún beneficiario coincide con "{{ busqueda }}".
                  } @else {
                    Este programa todavía no tiene beneficiarios (postulantes aceptados).
                  }
                </td></tr>
              }
            </tbody>
          </table>
          </div>
        }
      </div>
    }
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#9a4a2e; box-shadow:0 0 0 2px rgba(154,74,46,.2); }
  `],
})
export class BeneficiariosComponent implements OnInit {
  LABEL_APROVECHAMIENTO = LABEL_APROVECHAMIENTO;
  estadosAprovechamiento: EstadoAprovechamiento[] = ['PENDIENTE', 'ABANDONO', 'APROBADO', 'REPROBADO'];

  programas = signal<ProgramaResponse[]>([]);
  opcionesPrograma = computed(() => this.programas().map(p => ({ id: p.id, nombre: p.nombre })));
  beneficiarios = signal<PostulacionResponse[]>([]);
  programaSel: number | null = null;
  busqueda = '';
  cargando = signal(false);

  beneficiariosFiltrados = computed(() => {
    const texto = this.busqueda.trim().toLowerCase();
    const lista = this.beneficiarios();
    if (!texto) return lista;
    return lista.filter(b => b.nombrePostulante.toLowerCase().includes(texto));
  });

  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  constructor(
    private programaService: ProgramaService,
    private postulacionService: PostulacionService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe(d => this.programas.set(d));
    // Permite llegar directo con un programa preseleccionado desde "Programas"
    // (?programa=<id>, ver programas-admin.ts), en vez de tener que elegirlo
    // de nuevo en el filtro.
    const idPrograma = this.route.snapshot.queryParamMap.get('programa');
    if (idPrograma) {
      this.programaSel = +idPrograma;
      this.cargarBeneficiarios(this.programaSel);
    }
  }

  onProgramaChange(idPrograma: number | null): void {
    this.programaSel = idPrograma;
    this.busqueda = '';
    this.cargarBeneficiarios(idPrograma);
  }

  programaYaFinalizo(): boolean {
    const p = this.programaSel ? this.programas().find(x => x.id === this.programaSel) : null;
    return !!p && p.fechaFin < new Date().toISOString().slice(0, 10);
  }

  fechaFinProgramaSel(): string {
    const p = this.programaSel ? this.programas().find(x => x.id === this.programaSel) : null;
    return p ? 'finaliza el ' + p.fechaFin : '';
  }

  cargarBeneficiarios(idPrograma: number | null): void {
    if (!idPrograma) { this.beneficiarios.set([]); return; }
    this.cargando.set(true);
    this.postulacionService.listarPorPrograma(idPrograma).subscribe({
      next: (d) => {
        this.beneficiarios.set(d.filter(po => po.estado === 'ACEPTADA'));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  actualizarAprovechamiento(b: PostulacionResponse, estado: EstadoAprovechamiento): void {
    this.postulacionService.registrarAprovechamiento(b.id, estado).subscribe({
      next: (actualizado) => {
        b.estadoAprovechamiento = actualizado.estadoAprovechamiento;
        this.beneficiarios.update(list => [...list]);
        this.notificar('Estado actualizado a ' + actualizado.estadoAprovechamiento, false);
      },
      error: (err) => this.notificar(err?.error?.mensaje ?? 'No se pudo actualizar el estado de aprovechamiento.', true),
    });
  }

  badge(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'bg-amber-100 text-amber-800',
      APROBADO: 'bg-secondary-light text-on-secondary-container',
      REPROBADO: 'bg-error-container text-on-error-container',
      ABANDONO: 'bg-orange-100 text-orange-800',
    };
    return map[estado] ?? 'bg-surface-high text-on-surface-variant';
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
