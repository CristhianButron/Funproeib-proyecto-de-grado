import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { CriterioService } from '../../core/services/criterio.service';
import { ReqDocumentoService } from '../../core/services/reqdoc.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ProgramaResponse, ProgramaRequest } from '../../core/models/programa.model';
import { CriterioEvaluacionResponse } from '../../core/models/evaluacion.model';
import { ReqDocumentoResponse } from '../../core/models/documento.model';
import { PreguntaResponse } from '../../core/models/pregunta.model';

type SeccionId = 'datos' | 'descripcion' | 'requisitos' | 'preguntas' | 'criterios';

@Component({
  selector: 'app-programa-form',
  imports: [FormsModule, RouterLink],
  template: `
  <div>
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <nav class="text-xs text-on-surface-variant mb-1">
          <a routerLink="/admin/programas" class="hover:underline">Programas de formación</a>
          <span> / {{ idPrograma() ? (programa()?.nombre || '...') : 'Nuevo programa' }}</span>
        </nav>
        <h1 class="text-2xl font-extrabold text-primary-dark">{{ idPrograma() ? 'Editar programa' : 'Nuevo programa' }}</h1>
      </div>
      <div class="flex items-center gap-3">
        <a routerLink="/admin/programas" class="px-4 py-2 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-high transition-colors">Cancelar</a>
        @if (seccionActiva() === 'datos' || seccionActiva() === 'descripcion') {
          <button (click)="guardarDatos()" [disabled]="guardando()" class="px-5 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2 shadow-card">
            <span class="material-symbols-outlined text-[18px]">save</span> {{ guardando() ? 'Guardando...' : (idPrograma() ? 'Guardar cambios' : 'Guardar programa') }}
          </button>
        }
      </div>
    </div>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    @if (cargando()) {
      <p class="text-on-surface-variant py-10 text-center">Cargando...</p>
    } @else {
      <div class="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
        <!-- Nav lateral de secciones -->
        <nav class="bg-white rounded-xl shadow-card border border-outline-variant p-2 space-y-1">
          @for (s of secciones; track s.id) {
            <button (click)="irASeccion(s.id)" [disabled]="s.requiereId && !idPrograma()"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-semibold transition-colors"
              [class]="seccionActiva() === s.id ? 'bg-primary-fixed text-primary' : (s.requiereId && !idPrograma() ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-low')">
              <span class="material-symbols-outlined text-[20px]">{{ s.requiereId && !idPrograma() ? 'lock' : s.icono }}</span>
              {{ s.titulo }}
            </button>
          }
          @if (!idPrograma()) {
            <p class="text-xs text-on-surface-variant px-3 pt-2">Guarda los datos generales para habilitar requisitos, preguntas y criterios.</p>
          }
        </nav>

        <!-- Contenido de la sección activa -->
        <div class="bg-white rounded-xl shadow-card border border-outline-variant p-6 min-h-[420px]">

          @if (seccionActiva() === 'datos') {
          <section class="space-y-4 max-w-xl">
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
                <input type="date" [(ngModel)]="form.fechaFin" [min]="hoy" class="campo" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Cupos disponibles *</label>
                <input type="number" min="1" [(ngModel)]="form.cuposDisponibles" class="campo" placeholder="30" />
              </div>
            </div>
          </section>
          }

          @if (seccionActiva() === 'descripcion') {
          <section class="max-w-xl">
            <p class="text-xs text-on-surface-variant mb-4">
              Esto es lo que verá cualquier visitante en la pantalla pública de "convocatoria completa" antes de postularse.
            </p>
            <div class="mb-4">
              <label class="block text-sm font-semibold mb-1">Descripción general</label>
              <textarea [(ngModel)]="form.descripcion" rows="4" class="campo w-full" placeholder="Describe de qué se trata el programa, a quién está dirigido, etc."></textarea>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2">Módulos</label>
              <div class="space-y-1 mb-2">
                @for (m of form.modulos; track $index; let i = $index) {
                  <div class="flex items-center justify-between bg-surface-low rounded-lg px-3 py-1.5">
                    <span class="text-sm">{{ m }}</span>
                    <button (click)="quitarModulo(i)" class="text-error hover:bg-error-container rounded p-1" title="Quitar" aria-label="Quitar módulo"><span class="material-symbols-outlined text-[16px]">close</span></button>
                  </div>
                } @empty { <p class="text-xs text-on-surface-variant">Sin módulos aún.</p> }
              </div>
              <div class="flex gap-2">
                <input [(ngModel)]="nuevoModulo" (keydown.enter)="$event.preventDefault(); agregarModulo()" class="campo flex-1" placeholder="Ej: Módulo 1: Fundamentos" />
                <button (click)="agregarModulo()" class="px-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm">+</button>
              </div>
            </div>
          </section>
          }

          @if (seccionActiva() === 'requisitos') {
          <section>
            <h3 class="font-bold text-primary-dark flex items-center gap-2 mb-1"><span class="material-symbols-outlined">fact_check</span> Requisitos de documentos</h3>
            <p class="text-xs text-on-surface-variant mb-3">Estos son los que se piden al postulante al cargar documentos, y también lo que se muestra como "Requisitos" en la convocatoria pública.</p>
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
            <div class="grid grid-cols-2 gap-2 bg-surface rounded-lg p-3 max-w-xl">
              <input [(ngModel)]="nuevoReq.nombreDocumento" class="campo col-span-2" placeholder="Nombre del documento (ej: Hoja de vida)" />
              <input [(ngModel)]="nuevoReq.descripcion" class="campo col-span-2" placeholder="Descripción (opcional)" />
              <select [(ngModel)]="nuevoReq.tipoPermitido" class="campo"><option value="PDF">Archivo (PDF, Word o imagen)</option><option value="ENLACE">Enlace</option></select>
              <select [(ngModel)]="nuevoReq.obligatorio" class="campo"><option [ngValue]="true">Obligatorio</option><option [ngValue]="false">Opcional</option></select>
              <button (click)="agregarReq()" class="col-span-2 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm">+ Agregar requisito</button>
            </div>
          </section>
          }

          @if (seccionActiva() === 'preguntas') {
          <section>
            <h3 class="font-bold text-primary-dark flex items-center gap-2 mb-3"><span class="material-symbols-outlined">quiz</span> Preguntas de postulación</h3>
            <p class="text-xs text-on-surface-variant mb-3">El postulante responderá estas preguntas con texto. El evaluador las leerá para calificar los criterios.</p>
            <div class="space-y-2 mb-4">
              @for (q of preguntas(); track q.id) {
                <div class="flex items-center justify-between bg-surface-low rounded-lg px-4 py-2">
                  <p class="font-semibold text-sm flex-1">{{ q.orden }}. {{ q.enunciado }}</p>
                  <button (click)="eliminarPregunta(q)" class="text-error hover:bg-error-container rounded p-1" title="Eliminar" aria-label="Eliminar pregunta"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
              } @empty { <p class="text-sm text-on-surface-variant">Sin preguntas aún.</p> }
            </div>
            <div class="bg-surface rounded-lg p-3 space-y-2 max-w-xl">
              <textarea [(ngModel)]="nuevaPregunta" rows="2" class="campo w-full" placeholder="Ej: ¿Cuántas veces hiciste voluntariado y cuál te gustó más? Describe tu experiencia."></textarea>
              <button (click)="agregarPregunta()" class="w-full py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm">+ Agregar pregunta</button>
            </div>
          </section>
          }

          @if (seccionActiva() === 'criterios') {
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
            <div class="grid grid-cols-2 gap-2 bg-surface rounded-lg p-3 max-w-xl">
              <div class="col-span-2">
                <input [(ngModel)]="nuevoCriterio.nombreCriterio" (ngModelChange)="nombreCriterioInvalido.set(false)"
                  class="campo w-full" [class.campo-invalido]="nombreCriterioInvalido()" placeholder="Nombre del criterio (ej: Trabajo en equipo)" />
                @if (nombreCriterioInvalido()) { <p class="text-xs text-error mt-1">Campo requerido</p> }
              </div>
              <input [(ngModel)]="nuevoCriterio.descripcion" class="campo col-span-2" placeholder="Descripción (opcional)" />
              <button (click)="agregarCriterio()" [disabled]="guardandoCriterio()" class="col-span-2 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm">+ Agregar criterio</button>
            </div>
          </section>
          }
        </div>
      </div>
    }
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1d4e74; box-shadow:0 0 0 2px rgba(29,78,116,.2); }
    .campo-invalido { border-color:#ba1a1a; }
  `],
})
export class ProgramaFormComponent implements OnInit {
  hoy = new Date().toISOString().slice(0, 10);

  secciones: { id: SeccionId; titulo: string; icono: string; requiereId: boolean }[] = [
    { id: 'datos', titulo: 'Datos generales', icono: 'edit_note', requiereId: false },
    { id: 'descripcion', titulo: 'Descripción pública', icono: 'description', requiereId: false },
    { id: 'requisitos', titulo: 'Requisitos de documentos', icono: 'fact_check', requiereId: true },
    { id: 'preguntas', titulo: 'Preguntas de postulación', icono: 'quiz', requiereId: true },
    { id: 'criterios', titulo: 'Criterios de evaluación', icono: 'checklist', requiereId: true },
  ];
  seccionActiva = signal<SeccionId>('datos');

  idPrograma = signal<number | null>(null);
  programa = signal<ProgramaResponse | null>(null);
  cargando = signal(true);
  guardando = signal(false);

  form: ProgramaRequest = this.vacio();
  nuevoModulo = '';

  requisitos = signal<ReqDocumentoResponse[]>([]);
  preguntas = signal<PreguntaResponse[]>([]);
  criterios = signal<CriterioEvaluacionResponse[]>([]);
  criteriosActivos = computed(() => this.criterios().filter(c => c.activo));
  valorPorCriterio = computed(() => {
    const n = this.criteriosActivos().length;
    return n > 0 ? (100 / n).toFixed(2) : '0.00';
  });

  nuevoReq: { nombreDocumento: string; descripcion: string; tipoPermitido: 'PDF' | 'ENLACE'; obligatorio: boolean } =
    { nombreDocumento: '', descripcion: '', tipoPermitido: 'PDF', obligatorio: true };
  nuevaPregunta = '';

  nuevoCriterio = { nombreCriterio: '', descripcion: '' };
  editandoCriterioId = signal<number | null>(null);
  edicionCriterio = { nombreCriterio: '', descripcion: '' };
  guardandoCriterio = signal(false);
  nombreCriterioInvalido = signal(false);

  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private programaService: ProgramaService,
    private criterioService: CriterioService,
    private reqDocService: ReqDocumentoService,
    private preguntaService: PreguntaService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.criterioService.listarTodos().subscribe(c => this.criterios.set(c));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || idParam === 'nuevo') {
      this.form = this.vacio();
      this.cargando.set(false);
      return;
    }

    const id = Number(idParam);
    this.idPrograma.set(id);
    this.programaService.obtenerPorId(id).subscribe({
      next: (p) => {
        this.programa.set(p);
        this.form = { nombre: p.nombre, tipo: p.tipo, edicion: p.edicion ?? '', fechaInicio: p.fechaInicio, fechaFin: p.fechaFin, cuposDisponibles: p.cuposDisponibles, descripcion: p.descripcion ?? '', modulos: [...(p.modulos ?? [])] };
        this.cargando.set(false);
      },
      error: () => { this.notificar('No se pudo cargar el programa', true); this.cargando.set(false); },
    });
    this.reqDocService.listarPorPrograma(id).subscribe(r => this.requisitos.set(r));
    this.preguntaService.listarPorPrograma(id).subscribe(q => this.preguntas.set(q));
  }

  irASeccion(id: SeccionId): void {
    const s = this.secciones.find(x => x.id === id);
    if (s?.requiereId && !this.idPrograma()) return;
    this.seccionActiva.set(id);
  }

  vacio(): ProgramaRequest {
    return { nombre: '', tipo: 'DIPLOMADO', edicion: '', fechaInicio: '', fechaFin: '', cuposDisponibles: 30, descripcion: '', modulos: [] };
  }

  agregarModulo(): void {
    const v = this.nuevoModulo.trim();
    if (!v) return;
    this.form.modulos = [...(this.form.modulos ?? []), v];
    this.nuevoModulo = '';
  }

  quitarModulo(i: number): void {
    this.form.modulos = (this.form.modulos ?? []).filter((_, idx) => idx !== i);
  }

  guardarDatos(): void {
    this.guardando.set(true);
    const id = this.idPrograma();
    const obs = id ? this.programaService.actualizar(id, this.form) : this.programaService.crear(this.form);
    obs.subscribe({
      next: (p) => {
        this.guardando.set(false);
        if (id) {
          this.programa.set(p);
          this.notificar('Programa actualizado', false);
        } else {
          this.notificar('Programa creado. Ya puedes completar requisitos, preguntas y criterios.', false);
          this.router.navigate(['/admin/programas', p.id]);
        }
      },
      error: (err) => { this.guardando.set(false); this.notificar(err.error?.mensaje || 'Error al guardar', true); },
    });
  }

  agregarReq(): void {
    const idPrograma = this.idPrograma();
    if (!idPrograma || !this.nuevoReq.nombreDocumento) return;
    this.reqDocService.crear({ idPrograma, ...this.nuevoReq }).subscribe({
      next: (r) => { this.requisitos.update(l => [...l, r]); this.nuevoReq = { nombreDocumento: '', descripcion: '', tipoPermitido: 'PDF', obligatorio: true }; this.notificar('Requisito agregado', false); },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al agregar requisito', true),
    });
  }

  agregarPregunta(): void {
    const idPrograma = this.idPrograma();
    if (!idPrograma || !this.nuevaPregunta.trim()) return;
    const orden = this.preguntas().length + 1;
    this.preguntaService.crear({ idPrograma, enunciado: this.nuevaPregunta.trim(), orden }).subscribe({
      next: (q) => { this.preguntas.update(l => [...l, q]); this.nuevaPregunta = ''; this.notificar('Pregunta agregada', false); },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al agregar pregunta', true),
    });
  }

  async eliminarPregunta(q: PreguntaResponse): Promise<void> {
    const confirmado = await this.confirmDialog.confirmar({
      titulo: 'Eliminar pregunta',
      mensaje: `¿Eliminar la pregunta "${q.enunciado}"?`,
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.preguntaService.eliminar(q.id).subscribe({
      next: () => { this.preguntas.update(l => l.filter(x => x.id !== q.id)); this.notificar('Pregunta eliminada', false); },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al eliminar', true),
    });
  }

  agregarCriterio(): void {
    if (!this.nuevoCriterio.nombreCriterio.trim()) { this.nombreCriterioInvalido.set(true); return; }
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

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
