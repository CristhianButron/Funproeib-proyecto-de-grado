import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';
import { ProgramaService } from '../../core/services/programa.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { BeneficiarioReporte, ReporteFiltro } from '../../core/models/reporte.model';
import { ProgramaResponse, TipoPrograma } from '../../core/models/programa.model';
import { Genero, NivelEducativo } from '../../core/models/usuario.model';
import { CiudadResponse, PaisResponse } from '../../core/models/ubicacion.model';

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
      <h1 class="text-3xl font-extrabold text-primary-dark">Reportes de beneficiarios</h1>
      <p class="text-on-surface-variant">Personas que completaron talleres y diplomados ya finalizados, de todo el histórico. No incluye postulaciones en trámite.</p>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-5 mb-6 space-y-5">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label class="etiqueta">Género</label>
          <select class="campo" [ngModel]="filtro().genero ?? ''" (ngModelChange)="actualizar('genero', $event || null)">
            <option value="">Todos</option>
            @for (g of generos; track g) { <option [value]="g">{{ LABEL_GENERO[g] }}</option> }
          </select>
        </div>

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
          <label class="etiqueta">Nivel educativo</label>
          <select class="campo" [ngModel]="filtro().nivelEducativo ?? ''" (ngModelChange)="actualizar('nivelEducativo', $event || null)">
            <option value="">Todos</option>
            @for (n of niveles; track n) { <option [value]="n">{{ LABEL_NIVEL[n] }}</option> }
          </select>
        </div>

        <div>
          <label class="etiqueta">País de origen</label>
          <select class="campo" [ngModel]="filtro().idPais ?? ''" (ngModelChange)="setPais($event ? +$event : null)">
            <option value="">Todos</option>
            @for (p of paises(); track p.id) { <option [value]="p.id">{{ p.nombre }}</option> }
          </select>
        </div>

        <div>
          <label class="etiqueta">Ciudad</label>
          <select class="campo" [disabled]="!filtro().idPais" [ngModel]="filtro().idCiudad ?? ''" (ngModelChange)="actualizar('idCiudad', $event ? +$event : null)">
            <option value="">Todas</option>
            @for (c of ciudades(); track c.id) { <option [value]="c.id">{{ c.nombre }}</option> }
          </select>
        </div>

        <div>
          <label class="etiqueta">Programa finalizó desde</label>
          <input type="date" class="campo" [ngModel]="filtro().fechaDesde ?? ''" (ngModelChange)="actualizar('fechaDesde', $event || null)" />
        </div>

        <div>
          <label class="etiqueta">Programa finalizó hasta</label>
          <input type="date" class="campo" [ngModel]="filtro().fechaHasta ?? ''" (ngModelChange)="actualizar('fechaHasta', $event || null)" />
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-outline-variant">
        <button (click)="limpiar()" class="text-sm font-semibold text-on-surface-variant hover:text-primary flex items-center gap-1">
          <span class="material-symbols-outlined text-[18px]">filter_alt_off</span> Limpiar filtros
        </button>
        <button (click)="exportarCsv()" [disabled]="!beneficiarios().length" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-40 flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">download</span> Exportar CSV
        </button>
      </div>
    </div>

    <!-- Resumen -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl shadow-card border border-outline-variant">
        <p class="text-xs text-on-surface-variant uppercase">Total beneficiarios</p>
        <p class="text-2xl font-extrabold text-primary-dark">{{ beneficiarios().length }}</p>
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
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Beneficiario</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Género</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Edad</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Nivel educativo</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Procedencia</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Programa</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Finalizó</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (b of beneficiarios(); track b.idPostulacion) {
                <tr class="hover:bg-surface-low transition-colors">
                  <td class="px-6 py-4">
                    <p class="font-semibold text-primary">{{ b.nombreCompleto }}</p>
                    <p class="text-xs text-on-surface-variant">{{ b.ci }} · {{ b.correo }}</p>
                  </td>
                  <td class="px-6 py-4 text-sm">{{ LABEL_GENERO[b.genero] }}</td>
                  <td class="px-6 py-4 text-sm">{{ b.edad ?? '—' }}</td>
                  <td class="px-6 py-4 text-sm">{{ LABEL_NIVEL[b.nivelEducativo] }}</td>
                  <td class="px-6 py-4 text-sm">{{ b.ciudad }}{{ b.pais ? ', ' + b.pais : '' }}</td>
                  <td class="px-6 py-4 text-sm">
                    <p class="font-medium">{{ b.nombrePrograma }}</p>
                    <p class="text-xs text-on-surface-variant">{{ LABEL_TIPO[b.tipoPrograma] }}{{ b.edicion ? ' · ' + b.edicion : '' }}</p>
                  </td>
                  <td class="px-6 py-4 text-sm">{{ b.fechaFinPrograma }}</td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="px-6 py-10 text-center text-on-surface-variant">Ningún beneficiario coincide con los filtros seleccionados.</td></tr>
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
  `],
})
export class ReportesComponent implements OnInit {
  LABEL_GENERO = LABEL_GENERO;
  LABEL_NIVEL = LABEL_NIVEL;
  LABEL_TIPO = LABEL_TIPO;

  generos: Genero[] = ['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_INDICAR'];
  niveles: NivelEducativo[] = ['SECUNDARIA', 'TECNICO_MEDIO', 'TECNICO_SUPERIOR', 'LICENCIATURA', 'ESPECIALIZACION', 'MAESTRIA', 'DOCTORADO'];
  tipos: TipoPrograma[] = ['DIPLOMADO', 'CURSO', 'TALLER'];

  programas = signal<ProgramaResponse[]>([]);
  paises = signal<PaisResponse[]>([]);
  ciudades = signal<CiudadResponse[]>([]);
  beneficiarios = signal<BeneficiarioReporte[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  filtro = signal<ReporteFiltro>({});

  // Solo programas ya finalizados pueden tener beneficiarios en este reporte.
  programasFiltrados = computed(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    const tipo = this.filtro().tipoPrograma;
    return this.programas()
      .filter(p => p.fechaFin < hoy)
      .filter(p => !tipo || p.tipo === tipo);
  });

  resumenGenero = computed(() => {
    const conteo: Partial<Record<Genero, number>> = {};
    for (const b of this.beneficiarios()) conteo[b.genero] = (conteo[b.genero] ?? 0) + 1;
    return conteo;
  });

  constructor(
    private reporteService: ReporteService,
    private programaService: ProgramaService,
    private ubicacionService: UbicacionService,
  ) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe(d => this.programas.set(d));
    this.ubicacionService.listarPaises().subscribe(d => this.paises.set(d));
    this.generar();
  }

  setTipoPrograma(t: TipoPrograma | null): void {
    this.filtro.update(f => ({ ...f, tipoPrograma: t, idPrograma: null }));
    this.generar();
  }

  setPais(idPais: number | null): void {
    this.ciudades.set([]);
    this.filtro.update(f => ({ ...f, idPais, idCiudad: null }));
    if (idPais) {
      this.ubicacionService.listarCiudades(idPais).subscribe(d => this.ciudades.set(d));
    }
    this.generar();
  }

  actualizar<K extends keyof ReporteFiltro>(clave: K, valor: ReporteFiltro[K]): void {
    this.filtro.update(f => ({ ...f, [clave]: valor }));
    this.generar();
  }

  limpiar(): void {
    this.filtro.set({});
    this.ciudades.set([]);
    this.generar();
  }

  generar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.listarBeneficiarios(this.filtro()).subscribe({
      next: (d) => { this.beneficiarios.set(d); this.cargando.set(false); },
      error: () => {
        this.beneficiarios.set([]);
        this.cargando.set(false);
        this.error.set('No se pudo cargar el reporte. Verifica que el servidor esté disponible.');
      },
    });
  }

  exportarCsv(): void {
    const encabezados = ['Nombre', 'CI', 'Correo', 'Teléfono', 'Género', 'Edad', 'Nivel educativo', 'Ciudad', 'País', 'Programa', 'Tipo', 'Edición', 'Programa finalizó'];
    const filas = this.beneficiarios().map(b => [
      b.nombreCompleto, b.ci, b.correo, b.telefono ?? '', LABEL_GENERO[b.genero], b.edad ?? '',
      LABEL_NIVEL[b.nivelEducativo], b.ciudad ?? '', b.pais ?? '', b.nombrePrograma,
      LABEL_TIPO[b.tipoPrograma], b.edicion ?? '', b.fechaFinPrograma,
    ]);
    const escapar = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [encabezados, ...filas].map(fila => fila.map(escapar).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte-beneficiarios-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}
