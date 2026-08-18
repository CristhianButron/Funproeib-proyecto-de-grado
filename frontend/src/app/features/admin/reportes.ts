import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';
import { ProgramaService } from '../../core/services/programa.service';
import { InscritoReporte, ReporteFiltro } from '../../core/models/reporte.model';
import { ProgramaResponse, TipoPrograma } from '../../core/models/programa.model';
import { EstadoPostulacion } from '../../core/models/postulacion.model';
import { Genero, NivelEducativo } from '../../core/models/usuario.model';

const LABEL_GENERO: Record<Genero, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
  PREFIERO_NO_INDICAR: 'Prefiere no indicar',
};

const LABEL_NIVEL: Record<NivelEducativo, string> = {
  SECUNDARIA: 'Secundaria',
  TECNICO_MEDIO: 'Técnico medio',
  TECNICO_SUPERIOR: 'Técnico superior',
  LICENCIATURA: 'Licenciatura',
  ESPECIALIZACION: 'Especialización',
  MAESTRIA: 'Maestría',
  DOCTORADO: 'Doctorado',
};

const LABEL_TIPO: Record<TipoPrograma, string> = {
  DIPLOMADO: 'Diplomado',
  CURSO: 'Curso',
  TALLER: 'Taller',
};

@Component({
  selector: 'app-reportes',
  imports: [FormsModule],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Reportes de inscritos</h1>
      <p class="text-on-surface-variant">Filtra y cruza datos de los inscritos en talleres y diplomados.</p>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-5 mb-6 space-y-5">
      <div>
        <p class="text-xs font-bold text-on-surface-variant uppercase mb-2">Género</p>
        <div class="flex flex-wrap gap-2">
          <button (click)="setGenero(null)" class="chip" [class.chip-activo]="filtro().genero == null">Todos</button>
          @for (g of generos; track g) {
            <button (click)="setGenero(g)" class="chip" [class.chip-activo]="filtro().genero === g">{{ LABEL_GENERO[g] }}</button>
          }
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label class="etiqueta">Tipo de programa</label>
          <select class="campo" [ngModel]="filtro().tipoPrograma ?? ''" (ngModelChange)="setTipoPrograma($event || null)">
            <option value="">Todos</option>
            @for (t of tipos; track t) { <option [value]="t">{{ LABEL_TIPO[t] }}</option> }
          </select>
        </div>

        <div>
          <label class="etiqueta">Programa específico</label>
          <select class="campo" [ngModel]="filtro().idPrograma ?? ''" (ngModelChange)="actualizar('idPrograma', $event ? +$event : null)">
            <option value="">Todos</option>
            @for (p of programasFiltrados(); track p.id) { <option [value]="p.id">{{ p.nombre }} @if (p.edicion) { ({{ p.edicion }}) }</option> }
          </select>
        </div>

        <div>
          <label class="etiqueta">Estado de postulación</label>
          <select class="campo" [ngModel]="filtro().estado ?? ''" (ngModelChange)="actualizar('estado', $event || null)">
            <option value="">Todos</option>
            @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }
          </select>
        </div>

        <div>
          <label class="etiqueta">Nivel educativo</label>
          <select class="campo" [ngModel]="filtro().nivelEducativo ?? ''" (ngModelChange)="actualizar('nivelEducativo', $event || null)">
            <option value="">Todos</option>
            @for (n of niveles; track n) { <option [value]="n">{{ LABEL_NIVEL[n] }}</option> }
          </select>
        </div>

        <div>
          <label class="etiqueta">País de origen</label>
          <select class="campo" [ngModel]="filtro().paisOrigen ?? ''" (ngModelChange)="actualizar('paisOrigen', $event || null)">
            <option value="">Todos</option>
            @for (p of paises(); track p) { <option [value]="p">{{ p }}</option> }
          </select>
        </div>

        <div>
          <label class="etiqueta">Departamento</label>
          <select class="campo" [ngModel]="filtro().departamentoOrigen ?? ''" (ngModelChange)="actualizar('departamentoOrigen', $event || null)">
            <option value="">Todos</option>
            @for (d of departamentos(); track d) { <option [value]="d">{{ d }}</option> }
          </select>
        </div>

        <div>
          <label class="etiqueta">Postulado desde</label>
          <input type="date" class="campo" [ngModel]="filtro().fechaDesde ?? ''" (ngModelChange)="actualizar('fechaDesde', $event || null)" />
        </div>

        <div>
          <label class="etiqueta">Postulado hasta</label>
          <input type="date" class="campo" [ngModel]="filtro().fechaHasta ?? ''" (ngModelChange)="actualizar('fechaHasta', $event || null)" />
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-outline-variant">
        <button (click)="limpiar()" class="text-sm font-semibold text-on-surface-variant hover:text-primary flex items-center gap-1">
          <span class="material-symbols-outlined text-[18px]">filter_alt_off</span> Limpiar filtros
        </button>
        <button (click)="exportarCsv()" [disabled]="!inscritos().length" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-40 flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">download</span> Exportar CSV
        </button>
      </div>
    </div>

    <!-- Resumen -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl shadow-card border border-outline-variant">
        <p class="text-xs text-on-surface-variant uppercase">Total inscritos</p>
        <p class="text-2xl font-extrabold text-primary-dark">{{ inscritos().length }}</p>
      </div>
      @for (g of generos; track g) {
        <div class="bg-white p-4 rounded-xl shadow-card border border-outline-variant">
          <p class="text-xs text-on-surface-variant uppercase">{{ LABEL_GENERO[g] }}</p>
          <p class="text-2xl font-extrabold text-primary-dark">{{ resumenGenero()[g] ?? 0 }}</p>
        </div>
      }
    </div>

    @if (error()) {
      <div class="bg-error-container text-on-error-container rounded-xl px-4 py-3 mb-6 text-sm font-semibold flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">error</span> {{ error() }}
      </div>
    }

    <!-- Resultados -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
      @if (cargando()) {
        <p class="p-6 text-on-surface-variant">Generando reporte...</p>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-surface-low">
              <tr>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Inscrito</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Género</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Edad</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Nivel educativo</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Procedencia</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Programa</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Fecha</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (i of inscritos(); track i.idPostulacion) {
                <tr class="hover:bg-surface-low transition-colors">
                  <td class="px-6 py-4">
                    <p class="font-semibold text-primary">{{ i.nombreCompleto }}</p>
                    <p class="text-xs text-on-surface-variant">{{ i.ci }} · {{ i.correo }}</p>
                  </td>
                  <td class="px-6 py-4 text-sm">{{ LABEL_GENERO[i.genero] }}</td>
                  <td class="px-6 py-4 text-sm">{{ i.edad ?? '—' }}</td>
                  <td class="px-6 py-4 text-sm">{{ LABEL_NIVEL[i.nivelEducativo] }}</td>
                  <td class="px-6 py-4 text-sm">{{ i.paisOrigen }}{{ i.departamentoOrigen ? ', ' + i.departamentoOrigen : '' }}</td>
                  <td class="px-6 py-4 text-sm">
                    <p class="font-medium">{{ i.nombrePrograma }}</p>
                    <p class="text-xs text-on-surface-variant">{{ LABEL_TIPO[i.tipoPrograma] }}{{ i.edicion ? ' · ' + i.edicion : '' }}</p>
                  </td>
                  <td class="px-6 py-4 text-sm">{{ i.fechaPostulacion }}</td>
                  <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badge(i.estado)">{{ i.estado }}</span></td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="px-6 py-10 text-center text-on-surface-variant">Ningún inscrito coincide con los filtros seleccionados.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
    .etiqueta { display:block; font-size:.7rem; font-weight:700; text-transform:uppercase; color:#6b7280; margin-bottom:.3rem; }
    .chip { padding:.4rem 1rem; border-radius:999px; border:1px solid #c5c5d3; font-size:.8rem; font-weight:600; color:#4b5563; background:white; transition:all .15s; }
    .chip:hover { border-color:#1e3a8a; color:#1e3a8a; }
    .chip-activo { background:#1e3a8a; border-color:#1e3a8a; color:white; }
  `],
})
export class ReportesComponent implements OnInit {
  LABEL_GENERO = LABEL_GENERO;
  LABEL_NIVEL = LABEL_NIVEL;
  LABEL_TIPO = LABEL_TIPO;

  generos: Genero[] = ['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_INDICAR'];
  niveles: NivelEducativo[] = ['SECUNDARIA', 'TECNICO_MEDIO', 'TECNICO_SUPERIOR', 'LICENCIATURA', 'ESPECIALIZACION', 'MAESTRIA', 'DOCTORADO'];
  tipos: TipoPrograma[] = ['DIPLOMADO', 'CURSO', 'TALLER'];
  estados: EstadoPostulacion[] = ['INCOMPLETA', 'PENDIENTE', 'EVALUADA', 'ACEPTADA', 'RECHAZADA', 'BLOQUEADA'];

  programas = signal<ProgramaResponse[]>([]);
  paises = signal<string[]>([]);
  departamentos = signal<string[]>([]);
  inscritos = signal<InscritoReporte[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  filtro = signal<ReporteFiltro>({});

  programasFiltrados = computed(() => {
    const tipo = this.filtro().tipoPrograma;
    return tipo ? this.programas().filter(p => p.tipo === tipo) : this.programas();
  });

  resumenGenero = computed(() => {
    const conteo: Partial<Record<Genero, number>> = {};
    for (const i of this.inscritos()) conteo[i.genero] = (conteo[i.genero] ?? 0) + 1;
    return conteo;
  });

  constructor(
    private reporteService: ReporteService,
    private programaService: ProgramaService,
  ) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe(d => this.programas.set(d));
    this.reporteService.listarPaises().subscribe(d => this.paises.set(d));
    this.reporteService.listarDepartamentos().subscribe(d => this.departamentos.set(d));
    this.generar();
  }

  setGenero(g: Genero | null): void {
    this.actualizar('genero', g);
  }

  setTipoPrograma(t: TipoPrograma | null): void {
    this.filtro.update(f => ({ ...f, tipoPrograma: t, idPrograma: null }));
    this.generar();
  }

  actualizar<K extends keyof ReporteFiltro>(clave: K, valor: ReporteFiltro[K]): void {
    this.filtro.update(f => ({ ...f, [clave]: valor }));
    this.generar();
  }

  limpiar(): void {
    this.filtro.set({});
    this.generar();
  }

  generar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.listarInscritos(this.filtro()).subscribe({
      next: (d) => { this.inscritos.set(d); this.cargando.set(false); },
      error: () => {
        this.inscritos.set([]);
        this.cargando.set(false);
        this.error.set('No se pudo cargar el reporte. Verifica que el servidor esté disponible.');
      },
    });
  }

  exportarCsv(): void {
    const encabezados = ['Nombre', 'CI', 'Correo', 'Teléfono', 'Género', 'Edad', 'Nivel educativo', 'País', 'Departamento', 'Programa', 'Tipo', 'Edición', 'Fecha postulación', 'Estado'];
    const filas = this.inscritos().map(i => [
      i.nombreCompleto, i.ci, i.correo, i.telefono ?? '', LABEL_GENERO[i.genero], i.edad ?? '',
      LABEL_NIVEL[i.nivelEducativo], i.paisOrigen, i.departamentoOrigen ?? '', i.nombrePrograma,
      LABEL_TIPO[i.tipoPrograma], i.edicion ?? '', i.fechaPostulacion, i.estado,
    ]);
    const escapar = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [encabezados, ...filas].map(fila => fila.map(escapar).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte-inscritos-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
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
