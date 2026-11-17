import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
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
  imports: [FormsModule],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Beneficiarios</h1>
      <p class="text-on-surface-variant">Registra el estado final de los postulantes aceptados en cada programa.</p>
    </div>

    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-primary">filter_alt</span>
      <select [(ngModel)]="programaSel" (ngModelChange)="cargarBeneficiarios($event)" class="campo max-w-md">
        <option [ngValue]="null">Seleccione un programa...</option>
        @for (p of programas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
      </select>
    </div>

    @if (programaSel) {
      <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
        @if (cargando()) {
          <p class="p-6 text-on-surface-variant">Cargando...</p>
        } @else {
          <p class="px-6 pt-4 text-xs text-on-surface-variant">
            Abandono se puede marcar en cualquier momento. Aprobado/Reprobado solo una vez que el programa finalice{{ programaYaFinalizo() ? '' : ' (' + fechaFinProgramaSel() + ')' }}.
          </p>
          <table class="w-full text-left">
            <thead class="bg-surface-low">
              <tr>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Beneficiario</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Fecha de postulación</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Estado final</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (b of beneficiarios(); track b.id) {
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
                </tr>
              } @empty {
                <tr><td colspan="3" class="px-6 py-10 text-center text-on-surface-variant">Este programa todavía no tiene beneficiarios (postulantes aceptados).</td></tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
  `],
})
export class BeneficiariosComponent implements OnInit {
  LABEL_APROVECHAMIENTO = LABEL_APROVECHAMIENTO;
  estadosAprovechamiento: EstadoAprovechamiento[] = ['PENDIENTE', 'ABANDONO', 'APROBADO', 'REPROBADO'];

  programas = signal<ProgramaResponse[]>([]);
  beneficiarios = signal<PostulacionResponse[]>([]);
  programaSel: number | null = null;
  cargando = signal(false);

  constructor(
    private programaService: ProgramaService,
    private postulacionService: PostulacionService,
  ) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe(d => this.programas.set(d));
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
      },
      error: (err) => alert(err?.error?.mensaje ?? 'No se pudo actualizar el estado de aprovechamiento.'),
    });
  }

  badge(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'bg-surface-high text-on-surface-variant',
      APROBADO: 'bg-secondary-light text-on-secondary-container',
      REPROBADO: 'bg-error-container text-on-error-container',
      ABANDONO: 'bg-primary-fixed text-primary',
    };
    return map[estado] ?? 'bg-surface-high text-on-surface-variant';
  }
}
