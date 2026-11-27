import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { ProgramaResponse } from '../../core/models/programa.model';
import { PostulacionResponse } from '../../core/models/postulacion.model';

@Component({
  selector: 'app-postulantes',
  imports: [FormsModule, RouterLink],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Gestión de postulantes</h1>
      <p class="text-on-surface-variant">Revisa las postulaciones y verifica documentos.</p>
    </div>

    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-primary">filter_alt</span>
      <select [(ngModel)]="programaSel" (ngModelChange)="cargarPostulaciones($event)" class="campo max-w-md">
        <option [ngValue]="null">Seleccione un programa...</option>
        @for (p of programas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
      </select>
    </div>

    @if (programaSel) {
      <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
        @if (cargando()) {
          <p class="p-6 text-on-surface-variant">Cargando...</p>
        } @else {
          <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-surface-low">
              <tr>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Postulante</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Fecha</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Estado</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (po of postulaciones(); track po.id) {
                <tr class="hover:bg-surface-low transition-colors">
                  <td class="px-6 py-4 font-semibold text-primary">{{ po.nombrePostulante }}</td>
                  <td class="px-6 py-4 text-sm">{{ po.fechaPostulacion }}</td>
                  <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badge(po.estado)">{{ po.estado }}</span></td>
                  <td class="px-6 py-4 text-right">
                    <a [routerLink]="['../postulaciones', po.id]" class="px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed text-sm font-semibold flex items-center gap-1 ml-auto w-fit">
                      <span class="material-symbols-outlined text-[18px]">badge</span> Ver ficha
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="px-6 py-10 text-center text-on-surface-variant">Sin postulaciones para este programa.</td></tr>
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
export class PostulantesComponent implements OnInit {
  programas = signal<ProgramaResponse[]>([]);
  postulaciones = signal<PostulacionResponse[]>([]);
  programaSel: number | null = null;
  cargando = signal(false);

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
      this.cargarPostulaciones(this.programaSel);
    }
  }

  cargarPostulaciones(idPrograma: number | null): void {
    if (!idPrograma) { this.postulaciones.set([]); return; }
    this.cargando.set(true);
    this.postulacionService.listarPorPrograma(idPrograma).subscribe({
      next: (d) => { this.postulaciones.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  badge(estado: string): string {
    const map: Record<string, string> = {
      INCOMPLETA: 'bg-surface-high text-on-surface-variant',
      PENDIENTE: 'bg-primary-fixed text-primary',
      EVALUADA: 'bg-secondary-light text-on-secondary-container',
      ACEPTADA: 'bg-secondary-light text-on-secondary-container',
      RECHAZADA: 'bg-error-container text-on-error-container',
      BLOQUEADA: 'bg-error-container text-on-error-container',
    };
    return map[estado] ?? 'bg-surface-high text-on-surface-variant';
  }
}
