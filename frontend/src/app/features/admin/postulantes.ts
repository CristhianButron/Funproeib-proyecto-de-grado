import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { SelectBuscableComponent } from '../../core/components/select-buscable.component';
import { ProgramaResponse } from '../../core/models/programa.model';
import { PostulacionResponse } from '../../core/models/postulacion.model';

@Component({
  selector: 'app-postulantes',
  imports: [FormsModule, RouterLink, SelectBuscableComponent],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Gestión de postulantes</h1>
      <p class="text-on-surface-variant">Revisa las postulaciones y verifica documentos.</p>
    </div>

    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6 flex flex-wrap items-center gap-3">
      <span class="material-symbols-outlined text-primary">filter_alt</span>
      <div class="max-w-md flex-1 min-w-[220px]">
        <app-select-buscable [opciones]="opcionesPrograma()" [valor]="programaSel" placeholder="Seleccione un programa..."
          (cambio)="onProgramaChange($event)" />
      </div>
      @if (programaSel) {
        <div class="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <span class="material-symbols-outlined text-on-surface-variant">search</span>
          <input [(ngModel)]="busqueda" class="campo" placeholder="Buscar postulante por nombre..." />
        </div>
      }
    </div>

    @if (!programaSel) {
      <div class="text-center py-20 bg-white rounded-xl border border-outline-variant text-on-surface-variant">
        <span class="material-symbols-outlined text-5xl text-outline-variant">group</span>
        <p class="mt-3 font-semibold text-on-surface">Selecciona un programa para ver a sus postulantes</p>
        <p class="text-sm mt-1">Usa el filtro de arriba para elegir una convocatoria.</p>
      </div>
    } @else {
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        @for (e of resumenEstados(); track e.estado) {
          <div class="bg-white p-4 rounded-xl shadow-card border-l-4" [class]="colorBorde(e.estado)">
            <p class="text-[11px] text-on-surface-variant uppercase font-bold">{{ e.estado }}</p>
            <p class="text-2xl font-extrabold" [class]="colorTexto(e.estado)">{{ e.cantidad }}</p>
          </div>
        }
      </div>
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
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (po of postulacionesFiltradas(); track po.id) {
                <tr class="hover:bg-surface-low transition-colors">
                  <td class="px-6 py-4 font-semibold text-primary">{{ po.nombrePostulante }}</td>
                  <td class="px-6 py-4 text-sm">{{ po.fechaPostulacion }}</td>
                  <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badge(po.estado)">{{ po.estado }}</span></td>
                  <td class="px-6 py-4 text-right">
                    <a [routerLink]="['../postulaciones', po.id]" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors text-sm font-semibold">
                      <span class="material-symbols-outlined text-[18px]">badge</span> Ver ficha
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="px-6 py-10 text-center text-on-surface-variant">
                  @if (busqueda.trim()) {
                    Ningún postulante coincide con "{{ busqueda }}".
                  } @else {
                    Sin postulaciones para este programa.
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
    .campo:focus { border-color:#1d4e74; box-shadow:0 0 0 2px rgba(29,78,116,.2); }
  `],
})
export class PostulantesComponent implements OnInit {
  programas = signal<ProgramaResponse[]>([]);
  opcionesPrograma = computed(() => this.programas().map(p => ({ id: p.id, nombre: p.nombre })));
  postulaciones = signal<PostulacionResponse[]>([]);
  programaSel: number | null = null;
  busqueda = '';
  cargando = signal(false);

  postulacionesFiltradas = computed(() => {
    const texto = this.busqueda.trim().toLowerCase();
    const lista = this.postulaciones();
    if (!texto) return lista;
    return lista.filter(po => po.nombrePostulante.toLowerCase().includes(texto));
  });

  resumenEstados = computed(() => {
    const estados: string[] = ['INCOMPLETA', 'PENDIENTE', 'EVALUADA', 'ACEPTADA', 'RECHAZADA', 'BLOQUEADA'];
    const lista = this.postulaciones();
    return estados.map(estado => ({ estado, cantidad: lista.filter(p => p.estado === estado).length }));
  });

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

  onProgramaChange(idPrograma: number | null): void {
    this.programaSel = idPrograma;
    this.busqueda = '';
    this.cargarPostulaciones(idPrograma);
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
      PENDIENTE: 'bg-amber-100 text-amber-800',
      EVALUADA: 'bg-blue-100 text-blue-800',
      ACEPTADA: 'bg-secondary-light text-on-secondary-container',
      RECHAZADA: 'bg-error-container text-on-error-container',
      BLOQUEADA: 'bg-on-surface text-white',
    };
    return map[estado] ?? 'bg-surface-high text-on-surface-variant';
  }

  colorBorde(estado: string): string {
    const map: Record<string, string> = {
      INCOMPLETA: 'border-outline-variant',
      PENDIENTE: 'border-amber-500',
      EVALUADA: 'border-blue-500',
      ACEPTADA: 'border-secondary',
      RECHAZADA: 'border-error',
      BLOQUEADA: 'border-on-surface',
    };
    return map[estado] ?? 'border-outline-variant';
  }

  colorTexto(estado: string): string {
    const map: Record<string, string> = {
      INCOMPLETA: 'text-on-surface-variant',
      PENDIENTE: 'text-amber-700',
      EVALUADA: 'text-blue-700',
      ACEPTADA: 'text-secondary',
      RECHAZADA: 'text-error',
      BLOQUEADA: 'text-on-surface',
    };
    return map[estado] ?? 'text-on-surface-variant';
  }
}
