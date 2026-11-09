import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgramaService } from '../../core/services/programa.service';
import { CriterioService } from '../../core/services/criterio.service';
import { ReqDocumentoService } from '../../core/services/reqdoc.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { ProgramaResponse, ProgramaRequest, EstadoPrograma } from '../../core/models/programa.model';
import { CriterioEvaluacionResponse } from '../../core/models/evaluacion.model';
import { ReqDocumentoResponse } from '../../core/models/documento.model';
import { PreguntaResponse } from '../../core/models/pregunta.model';

@Component({
  selector: 'app-programas-admin',
  imports: [FormsModule],
  template: `
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-extrabold text-primary-dark">Programas de formación</h1>
        <p class="text-on-surface-variant">Crea y gestiona las convocatorias.</p>
      </div>
      <button (click)="abrirCrear()" class="px-5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-card">
        <span class="material-symbols-outlined">add</span> Crear programa
      </button>
    </div>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <!-- Búsqueda -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-3 mb-4 flex items-center gap-2">
      <span class="material-symbols-outlined text-outline">search</span>
      <input [(ngModel)]="busqueda" (ngModelChange)="busquedaSignal.set($event)" class="flex-1 outline-none text-sm" placeholder="Buscar por nombre o tipo..." />
    </div>

    <!-- Resumen por estado -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      @for (e of estados; track e) {
        <div class="bg-white p-4 rounded-xl shadow-card border-l-4" [class]="colorBorde(e)">
          <p class="text-xs text-on-surface-variant uppercase font-bold">{{ e }}</p>
          <p class="text-2xl font-extrabold" [class]="colorTexto(e)">{{ contarEstado(e) }}</p>
        </div>
      }
    </div>

    <!-- Tarjetas de programas -->
    @if (cargando()) {
      <p class="p-6 text-on-surface-variant">Cargando...</p>
    } @else {
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (p of programasFiltrados(); track p.id) {
          <div class="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow border-l-4 flex flex-col" [class]="colorBorde(p.estado)">
            <div class="p-5 flex-1">
              <div class="flex items-center justify-between mb-3">
                <span class="inline-flex items-center gap-1 text-xs font-bold uppercase text-on-surface-variant">
                  <span class="material-symbols-outlined text-[16px]">{{ iconoTipo(p.tipo) }}</span> {{ p.tipo }}
                </span>
                <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badge(p.estado)">{{ p.estado }}</span>
              </div>
              <h3 class="font-bold text-lg text-on-surface leading-tight">{{ p.nombre }}</h3>
              @if (p.edicion) { <p class="text-xs text-on-surface-variant mt-0.5">Edición {{ p.edicion }}</p> }
              <div class="mt-4 space-y-2 text-sm text-on-surface-variant">
                <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">event</span>{{ p.fechaInicio }} → {{ p.fechaFin }}</p>
                <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">groups</span>{{ p.cuposDisponibles }} cupos</p>
              </div>
            </div>
            <div class="border-t border-outline-variant px-5 py-3 flex items-center justify-between gap-2">
              <select [ngModel]="p.estado" (ngModelChange)="cambiarEstado(p, $event)" class="text-xs font-semibold rounded-lg px-2 py-1.5 border border-outline-variant bg-white cursor-pointer">
                <option value="BORRADOR">Borrador</option>
                <option value="ACTIVO">Activo</option>
                <option value="ABIERTO">Abierto</option>
                <option value="CERRADO">Cerrado</option>
              </select>
              <div class="flex items-center gap-1">
                <button (click)="abrirEditar(p)" class="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-high transition-colors" title="Editar">
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button (click)="configurar(p)" class="px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed transition-colors text-xs font-bold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">tune</span> Configurar
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-span-full text-center py-16 text-on-surface-variant bg-white rounded-xl border border-outline-variant">
            <span class="material-symbols-outlined text-5xl text-outline-variant">school</span>
            <p class="mt-3">No hay programas que coincidan.</p>
          </div>
        }
      </div>
    }
  </div>

  <!-- Modal crear/editar -->
  @if (modalForm()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="modalForm.set(false)">
      <div class="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden" (click)="$event.stopPropagation()">
        <div class="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <h2 class="font-bold text-lg flex items-center gap-2">
            <span class="material-symbols-outlined">{{ editandoId() ? 'edit' : 'add_circle' }}</span>
            {{ editandoId() ? 'Editar programa' : 'Nuevo programa' }}
          </h2>
          <button (click)="modalForm.set(false)"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-1">Nombre del programa *</label>
            <input [(ngModel)]="form.nombre" class="campo" placeholder="Ej: Diplomado en Educación Intercultural" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Tipo *</label>
              <select [(ngModel)]="form.tipo" class="campo">
                <option value="DIPLOMADO">Diplomado</option>
                <option value="CURSO">Curso</option>
                <option value="TALLER">Taller</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Edición</label>
              <input [(ngModel)]="form.edicion" class="campo" placeholder="Ej: 2026-I" maxlength="10" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Fecha inicio *</label>
              <input type="date" [(ngModel)]="form.fechaInicio" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Fecha fin *</label>
              <input type="date" [(ngModel)]="form.fechaFin" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Cupos disponibles *</label>
              <input type="number" min="1" [(ngModel)]="form.cuposDisponibles" class="campo" placeholder="30" />
            </div>
          </div>
        </div>
        <div class="bg-surface-low px-6 py-4 flex justify-end gap-3">
          <button (click)="modalForm.set(false)" class="px-5 py-2 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-high transition-colors">Cancelar</button>
          <button (click)="guardar()" [disabled]="guardando()" class="px-5 py-2 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
            {{ guardando() ? 'Guardando...' : (editandoId() ? 'Guardar cambios' : 'Guardar programa') }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- Modal configurar -->
  @if (programaConfig(); as pc) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="programaConfig.set(null)">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="bg-tertiary text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 class="font-bold text-lg">{{ pc.nombre }}</h2>
            <p class="text-on-tertiary-container text-sm">Requisitos, preguntas y criterios</p>
          </div>
          <button (click)="programaConfig.set(null)"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-6 overflow-y-auto custom-scrollbar space-y-8">

          <!-- Requisitos -->
          <section>
            <h3 class="font-bold text-primary-dark flex items-center gap-2 mb-3"><span class="material-symbols-outlined">description</span> Requisitos de documentos</h3>
            <div class="space-y-2 mb-4">
              @for (r of requisitos(); track r.id) {
                <div class="flex items-center justify-between bg-surface-low rounded-lg px-4 py-2">
                  <div>
                    <p class="font-semibold text-sm">{{ r.nombreDocumento }}
                      <span class="text-xs font-bold ml-2" [class]="r.obligatorio ? 'text-error' : 'text-on-surface-variant'">{{ r.obligatorio ? 'Obligatorio' : 'Opcional' }}</span>
                    </p>
                    <p class="text-xs text-on-surface-variant">{{ r.descripcion }} · {{ r.tipoPermitido === 'ENLACE' ? 'Enlace' : 'Archivo' }}</p>
                  </div>
                </div>
              } @empty { <p class="text-sm text-on-surface-variant">Sin requisitos aún.</p> }
            </div>
            <div class="grid grid-cols-2 gap-2 bg-surface rounded-lg p-3">
              <input [(ngModel)]="nuevoReq.nombreDocumento" class="campo col-span-2" placeholder="Nombre del documento (ej: Hoja de vida)" />
              <input [(ngModel)]="nuevoReq.descripcion" class="campo col-span-2" placeholder="Descripción (opcional)" />
              <select [(ngModel)]="nuevoReq.tipoPermitido" class="campo"><option value="PDF">Archivo (PDF, Word o imagen)</option><option value="ENLACE">Enlace</option></select>
              <select [(ngModel)]="nuevoReq.obligatorio" class="campo"><option [ngValue]="true">Obligatorio</option><option [ngValue]="false">Opcional</option></select>
              <button (click)="agregarReq(pc.id)" class="col-span-2 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm">+ Agregar requisito</button>
            </div>
          </section>

          <!-- Preguntas -->
          <section>
            <h3 class="font-bold text-primary-dark flex items-center gap-2 mb-3"><span class="material-symbols-outlined">quiz</span> Preguntas de postulación</h3>
            <p class="text-xs text-on-surface-variant mb-3">El postulante responderá estas preguntas con texto. El evaluador las leerá para calificar los criterios.</p>
            <div class="space-y-2 mb-4">
              @for (q of preguntas(); track q.id) {
                <div class="flex items-center justify-between bg-surface-low rounded-lg px-4 py-2">
                  <p class="font-semibold text-sm flex-1">{{ q.orden }}. {{ q.enunciado }}</p>
                  <button (click)="eliminarPregunta(q)" class="text-error hover:bg-error-container rounded p-1" title="Eliminar"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
              } @empty { <p class="text-sm text-on-surface-variant">Sin preguntas aún.</p> }
            </div>
            <div class="bg-surface rounded-lg p-3 space-y-2">
              <textarea [(ngModel)]="nuevaPregunta" rows="2" class="campo w-full" placeholder="Ej: ¿Cuántas veces hiciste voluntariado y cuál te gustó más? Describe tu experiencia."></textarea>
              <button (click)="agregarPregunta(pc.id)" class="w-full py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm">+ Agregar pregunta</button>
            </div>
          </section>

          <!-- Criterios -->
          <section>
            <h3 class="font-bold text-primary-dark flex items-center gap-2 mb-3"><span class="material-symbols-outlined">checklist</span> Criterios de evaluación</h3>
            <p class="text-xs text-on-surface-variant mb-3">
              Son los mismos para todos los programas (no se configuran por programa). Cada uno se califica de 1 a 10, y el puntaje total de la evaluación se ajusta solo para sumar 100: ahora mismo hay
              <b>{{ criteriosActivos().length }}</b> activo(s), cada uno vale hasta <b>{{ valorPorCriterio() }}</b> pts.
            </p>
            <div class="space-y-2 mb-4">
              @for (c of criterios(); track c.id) {
                <div class="bg-surface-low rounded-lg px-4 py-2" [class.opacity-50]="!c.activo">
                  @if (editandoCriterioId() === c.id) {
                    <input [(ngModel)]="edicionCriterio.nombreCriterio" class="campo mb-1" placeholder="Nombre" />
                    <input [(ngModel)]="edicionCriterio.descripcion" class="campo mb-2" placeholder="Descripción (opcional)" />
                    <div class="flex gap-2">
                      <button (click)="guardarEdicionCriterio(c)" [disabled]="guardandoCriterio()" class="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors">Guardar</button>
                      <button (click)="cancelarEdicionCriterio()" class="px-3 py-1 rounded-lg text-on-surface-variant hover:bg-surface-high text-xs font-semibold">Cancelar</button>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <p class="font-semibold text-sm">{{ c.orden }}. {{ c.nombreCriterio }}
                          @if (!c.activo) { <span class="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface-high text-on-surface-variant">Inactivo</span> }
                        </p>
                        @if (c.descripcion) { <p class="text-xs text-on-surface-variant">{{ c.descripcion }}</p> }
                      </div>
                      <div class="flex items-center gap-1 shrink-0">
                        <button (click)="iniciarEdicionCriterio(c)" class="px-2 py-1 rounded-lg text-primary hover:bg-primary-fixed text-xs font-semibold">Editar</button>
                        @if (c.activo) {
                          <button (click)="desactivarCriterio(c)" class="px-2 py-1 rounded-lg text-error hover:bg-error-container text-xs font-semibold">Desactivar</button>
                        } @else {
                          <button (click)="activarCriterio(c)" class="px-2 py-1 rounded-lg text-secondary hover:bg-secondary-light text-xs font-semibold">Reactivar</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @empty { <p class="text-sm text-on-surface-variant">Sin criterios aún.</p> }
            </div>
            <div class="grid grid-cols-2 gap-2 bg-surface rounded-lg p-3">
              <input [(ngModel)]="nuevoCriterio.nombreCriterio" class="campo col-span-2" placeholder="Nombre del criterio (ej: Trabajo en equipo)" />
              <input [(ngModel)]="nuevoCriterio.descripcion" class="campo col-span-2" placeholder="Descripción (opcional)" />
              <button (click)="agregarCriterio()" [disabled]="guardandoCriterio()" class="col-span-2 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm">+ Agregar criterio</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
  `],
})
export class ProgramasAdminComponent implements OnInit {
  estados: EstadoPrograma[] = ['BORRADOR', 'ACTIVO', 'ABIERTO', 'CERRADO'];

  programas = signal<ProgramaResponse[]>([]);
  busqueda = '';
  busquedaSignal = signal('');
  programasFiltrados = computed(() => {
    const b = this.busquedaSignal().toLowerCase().trim();
    if (!b) return this.programas();
    return this.programas().filter(p => p.nombre.toLowerCase().includes(b) || p.tipo.toLowerCase().includes(b));
  });

  cargando = signal(true);
  guardando = signal(false);
  modalForm = signal(false);
  editandoId = signal<number | null>(null);
  programaConfig = signal<ProgramaResponse | null>(null);
  criterios = signal<CriterioEvaluacionResponse[]>([]);
  criteriosActivos = computed(() => this.criterios().filter(c => c.activo));
  valorPorCriterio = computed(() => {
    const n = this.criteriosActivos().length;
    return n > 0 ? (100 / n).toFixed(2) : '0.00';
  });
  requisitos = signal<ReqDocumentoResponse[]>([]);
  preguntas = signal<PreguntaResponse[]>([]);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  form: ProgramaRequest = this.vacio();
  nuevoReq: { nombreDocumento: string; descripcion: string; tipoPermitido: 'PDF' | 'ENLACE'; obligatorio: boolean } =
    { nombreDocumento: '', descripcion: '', tipoPermitido: 'PDF', obligatorio: true };
  nuevaPregunta = '';

  nuevoCriterio = { nombreCriterio: '', descripcion: '' };
  editandoCriterioId = signal<number | null>(null);
  edicionCriterio = { nombreCriterio: '', descripcion: '' };
  guardandoCriterio = signal(false);

  constructor(
    private programaService: ProgramaService,
    private criterioService: CriterioService,
    private reqDocService: ReqDocumentoService,
    private preguntaService: PreguntaService,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.criterioService.listarTodos().subscribe(c => this.criterios.set(c));
  }

  cargar(): void {
    this.cargando.set(true);
    this.programaService.listarTodos().subscribe({
      next: (data) => { this.programas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  vacio(): ProgramaRequest {
    return { nombre: '', tipo: 'DIPLOMADO', edicion: '', fechaInicio: '', fechaFin: '', cuposDisponibles: 30 };
  }

  abrirCrear(): void { this.form = this.vacio(); this.editandoId.set(null); this.modalForm.set(true); }

  abrirEditar(p: ProgramaResponse): void {
    this.form = { nombre: p.nombre, tipo: p.tipo, edicion: p.edicion ?? '', fechaInicio: p.fechaInicio, fechaFin: p.fechaFin, cuposDisponibles: p.cuposDisponibles };
    this.editandoId.set(p.id);
    this.modalForm.set(true);
  }

  guardar(): void {
    this.guardando.set(true);
    const id = this.editandoId();
    const obs = id ? this.programaService.actualizar(id, this.form) : this.programaService.crear(this.form);
    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalForm.set(false);
        this.notificar(id ? 'Programa actualizado' : 'Programa creado', false);
        this.cargar();
      },
      error: (err) => { this.guardando.set(false); this.notificar(err.error?.mensaje || 'Error al guardar', true); },
    });
  }

  cambiarEstado(p: ProgramaResponse, estado: EstadoPrograma): void {
    this.programaService.cambiarEstado(p.id, estado).subscribe({
      next: (a) => { this.programas.update(l => l.map(x => x.id === p.id ? { ...x, estado: a.estado } : x)); this.notificar('Estado actualizado', false); },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al cambiar estado', true),
    });
  }

  configurar(p: ProgramaResponse): void {
    this.programaConfig.set(p);
    this.requisitos.set([]); this.preguntas.set([]);
    this.reqDocService.listarPorPrograma(p.id).subscribe(r => this.requisitos.set(r));
    this.preguntaService.listarPorPrograma(p.id).subscribe(q => this.preguntas.set(q));
  }

  agregarReq(idPrograma: number): void {
    if (!this.nuevoReq.nombreDocumento) return;
    this.reqDocService.crear({ idPrograma, ...this.nuevoReq }).subscribe({
      next: (r) => { this.requisitos.update(l => [...l, r]); this.nuevoReq = { nombreDocumento: '', descripcion: '', tipoPermitido: 'PDF', obligatorio: true }; },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al agregar requisito', true),
    });
  }

  agregarPregunta(idPrograma: number): void {
    if (!this.nuevaPregunta.trim()) return;
    const orden = this.preguntas().length + 1;
    this.preguntaService.crear({ idPrograma, enunciado: this.nuevaPregunta.trim(), orden }).subscribe({
      next: (q) => { this.preguntas.update(l => [...l, q]); this.nuevaPregunta = ''; },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al agregar pregunta', true),
    });
  }

  eliminarPregunta(q: PreguntaResponse): void {
    this.preguntaService.eliminar(q.id).subscribe({
      next: () => this.preguntas.update(l => l.filter(x => x.id !== q.id)),
      error: (err) => this.notificar(err.error?.mensaje || 'Error al eliminar', true),
    });
  }

  agregarCriterio(): void {
    if (!this.nuevoCriterio.nombreCriterio.trim()) { this.notificar('Ingresa el nombre del criterio', true); return; }
    this.guardandoCriterio.set(true);
    this.criterioService.crear({
      nombreCriterio: this.nuevoCriterio.nombreCriterio.trim(),
      descripcion: this.nuevoCriterio.descripcion.trim() || undefined,
    }).subscribe({
      next: (c) => {
        this.guardandoCriterio.set(false);
        this.criterios.update(l => [...l, c]);
        this.nuevoCriterio = { nombreCriterio: '', descripcion: '' };
        this.notificar(`Criterio agregado. Ahora cada criterio activo vale ${this.valorPorCriterio()} puntos.`, false);
      },
      error: (err) => { this.guardandoCriterio.set(false); this.notificar(err.error?.mensaje || 'Error al agregar el criterio', true); },
    });
  }

  iniciarEdicionCriterio(c: CriterioEvaluacionResponse): void {
    this.editandoCriterioId.set(c.id);
    this.edicionCriterio = { nombreCriterio: c.nombreCriterio, descripcion: c.descripcion ?? '' };
  }

  cancelarEdicionCriterio(): void {
    this.editandoCriterioId.set(null);
  }

  guardarEdicionCriterio(c: CriterioEvaluacionResponse): void {
    if (!this.edicionCriterio.nombreCriterio.trim()) { this.notificar('El nombre no puede quedar vacío', true); return; }
    this.guardandoCriterio.set(true);
    this.criterioService.actualizar(c.id, {
      nombreCriterio: this.edicionCriterio.nombreCriterio.trim(),
      descripcion: this.edicionCriterio.descripcion.trim() || undefined,
    }).subscribe({
      next: (actualizado) => {
        this.guardandoCriterio.set(false);
        this.criterios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.editandoCriterioId.set(null);
        this.notificar('Criterio actualizado', false);
      },
      error: (err) => { this.guardandoCriterio.set(false); this.notificar(err.error?.mensaje || 'Error al actualizar el criterio', true); },
    });
  }

  desactivarCriterio(c: CriterioEvaluacionResponse): void {
    this.criterioService.cambiarActivo(c.id, false).subscribe({
      next: (actualizado) => {
        this.criterios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.notificar(`Criterio desactivado. Ahora cada criterio activo vale ${this.valorPorCriterio()} puntos.`, false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al desactivar el criterio', true),
    });
  }

  activarCriterio(c: CriterioEvaluacionResponse): void {
    this.criterioService.cambiarActivo(c.id, true).subscribe({
      next: (actualizado) => {
        this.criterios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.notificar(`Criterio reactivado. Ahora cada criterio activo vale ${this.valorPorCriterio()} puntos.`, false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al reactivar el criterio', true),
    });
  }

  badge(estado: string): string {
    const map: Record<string, string> = {
      BORRADOR: 'bg-surface-high text-on-surface-variant',
      ACTIVO: 'bg-primary-fixed text-primary',
      ABIERTO: 'bg-secondary-light text-on-secondary-container',
      CERRADO: 'bg-error-container text-on-error-container',
    };
    return map[estado] ?? '';
  }

  colorBorde(estado: string): string {
    const map: Record<string, string> = {
      BORRADOR: 'border-outline-variant',
      ACTIVO: 'border-primary',
      ABIERTO: 'border-secondary',
      CERRADO: 'border-error',
    };
    return map[estado] ?? 'border-outline-variant';
  }

  colorTexto(estado: string): string {
    const map: Record<string, string> = {
      BORRADOR: 'text-on-surface-variant',
      ACTIVO: 'text-primary',
      ABIERTO: 'text-secondary',
      CERRADO: 'text-error',
    };
    return map[estado] ?? 'text-on-surface-variant';
  }

  iconoTipo(tipo: string): string {
    const map: Record<string, string> = {
      DIPLOMADO: 'school',
      CURSO: 'menu_book',
      TALLER: 'construction',
    };
    return map[tipo] ?? 'school';
  }

  contarEstado(estado: EstadoPrograma): number {
    return this.programas().filter(p => p.estado === estado).length;
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
