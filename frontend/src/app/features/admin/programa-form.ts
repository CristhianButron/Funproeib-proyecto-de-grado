import { Component, OnInit, Signal, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { CriterioService } from '../../core/services/criterio.service';
import { ReqDocumentoService } from '../../core/services/reqdoc.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { ProgramaResponse, ProgramaRequest } from '../../core/models/programa.model';
import { badgePrograma } from '../../core/utils/estado-colores';
import { CriterioEvaluacionResponse } from '../../core/models/evaluacion.model';
import { ReqDocumentoResponse } from '../../core/models/documento.model';
import { PreguntaResponse } from '../../core/models/pregunta.model';

type SeccionId = 'datos' | 'descripcion' | 'requisitos' | 'preguntas' | 'criterios';

@Component({
  selector: 'app-programa-form',
  imports: [FormsModule, RouterLink],
  template: `
  <div class="max-w-6xl mx-auto">
    <!-- Encabezado -->
    <div class="bg-white rounded-2xl shadow-card border border-outline-variant overflow-hidden mb-6">
      <div class="h-1.5 bg-gradient-to-r from-primary to-secondary"></div>
      <div class="p-6 flex items-center justify-between flex-wrap gap-4">
        <div class="min-w-0">
          <nav class="text-xs text-on-surface-variant mb-1.5 flex items-center gap-1">
            <a routerLink="/admin/programas" class="hover:underline hover:text-primary transition-colors">Programas de formación</a>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="font-semibold text-on-surface truncate">{{ idPrograma() ? (programa()?.nombre || '...') : 'Nuevo programa' }}</span>
          </nav>
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-extrabold text-primary-dark">{{ idPrograma() ? 'Editar programa' : 'Nuevo programa' }}</h1>
            @if (programa(); as p) {
              <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badgeEstado(p.estado)">{{ p.estado }}</span>
            }
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <a routerLink="/admin/programas" class="px-4 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-low transition-colors">Cancelar</a>
        </div>
      </div>
    </div>

    @if (cargando()) {
      <p class="text-on-surface-variant py-10 text-center">Cargando...</p>
    } @else {
      <div class="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <!-- Nav lateral de secciones -->
        <nav class="bg-white rounded-2xl shadow-card border border-outline-variant p-3">
          <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wide px-3 pt-1 pb-2">Secciones</p>
          <div class="space-y-1">
            @for (s of secciones; track s.id) {
              @let bloqueada = s.requiereId && !idPrograma();
              <button (click)="irASeccion(s.id)" [disabled]="bloqueada"
                class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors"
                [class]="seccionActiva() === s.id ? 'bg-primary text-white shadow-card' : (bloqueada ? 'opacity-50 cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-low')">
                <span class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" [class]="seccionActiva() === s.id ? 'bg-white/15' : 'bg-primary-fixed text-primary'">
                  <span class="material-symbols-outlined text-[19px]">{{ bloqueada ? 'lock' : s.icono }}</span>
                </span>
                <span class="text-sm font-semibold leading-tight">{{ s.titulo }}</span>
              </button>
            }
          </div>
          @if (!idPrograma()) {
            <p class="text-xs text-on-surface-variant px-3 pt-3 mt-2 border-t border-outline-variant leading-relaxed">
              Guarda los datos generales para habilitar requisitos, preguntas y criterios.
            </p>
          }
        </nav>

        <!-- Contenido de la sección activa -->
        <div class="bg-white rounded-2xl shadow-card border border-outline-variant p-8 min-h-[460px]">

          @if (seccionActiva() === 'datos') {
          <section>
            <div class="flex items-center gap-3 mb-6 pb-5 border-b border-outline-variant">
              <span class="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0"><span class="material-symbols-outlined">edit_note</span></span>
              <div>
                <h2 class="font-bold text-on-surface text-lg">Datos generales</h2>
                <p class="text-xs text-on-surface-variant">Información básica de la convocatoria.</p>
              </div>
            </div>
            <div class="space-y-5 max-w-xl">
              <div>
                <label class="block text-sm font-semibold mb-1.5">Nombre del programa *</label>
                <input [(ngModel)]="form.nombre" (ngModelChange)="nombreInvalido.set(false)"
                  class="campo" [class.campo-invalido]="nombreInvalido()" placeholder="Ej: Diplomado en Educación Intercultural" />
                @if (nombreInvalido()) { <p class="text-xs text-error mt-1">Campo requerido</p> }
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold mb-1.5">Tipo *</label>
                  <select [(ngModel)]="form.tipo" class="campo">
                    <option value="DIPLOMADO">Diplomado</option>
                    <option value="CURSO">Curso</option>
                    <option value="TALLER">Taller</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-1.5">Edición</label>
                  <input [(ngModel)]="form.edicion" class="campo" placeholder="Ej: 2026-I" maxlength="10" />
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-1.5">Fecha inicio *</label>
                  <input type="date" [(ngModel)]="form.fechaInicio" (ngModelChange)="fechaInicioInvalida.set(false)"
                    class="campo" [class.campo-invalido]="fechaInicioInvalida()" />
                  @if (fechaInicioInvalida()) { <p class="text-xs text-error mt-1">Campo requerido</p> }
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-1.5">Fecha fin *</label>
                  <input type="date" [(ngModel)]="form.fechaFin" (ngModelChange)="fechaFinInvalida.set(false)"
                    [min]="hoy" class="campo" [class.campo-invalido]="fechaFinInvalida()" />
                  @if (fechaFinInvalida()) { <p class="text-xs text-error mt-1">Campo requerido</p> }
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-1.5">Cupos disponibles *</label>
                  <input type="number" min="1" [(ngModel)]="form.cuposDisponibles" (ngModelChange)="cuposInvalidos.set(false)"
                    class="campo" [class.campo-invalido]="cuposInvalidos()" placeholder="30" />
                  @if (cuposInvalidos()) { <p class="text-xs text-error mt-1">Debe ser al menos 1</p> }
                </div>
              </div>
            </div>
          </section>
          }

          @if (seccionActiva() === 'descripcion') {
          <section>
            <div class="flex items-center gap-3 mb-2 pb-5 border-b border-outline-variant">
              <span class="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0"><span class="material-symbols-outlined">description</span></span>
              <div>
                <h2 class="font-bold text-on-surface text-lg">Descripción pública</h2>
                <p class="text-xs text-on-surface-variant">Esto es lo que verá cualquier visitante en la convocatoria completa antes de postularse.</p>
              </div>
            </div>
            <div class="max-w-xl mt-6">
              <div class="mb-6">
                <label class="block text-sm font-semibold mb-1.5">Descripción general</label>
                <textarea [(ngModel)]="form.descripcion" rows="4" class="campo w-full" placeholder="Describe de qué se trata el programa, a quién está dirigido, etc."></textarea>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-2">Módulos</label>
                <div class="space-y-2 mb-3">
                  @for (m of form.modulos; track $index; let i = $index) {
                    <div class="flex items-center justify-between rounded-xl border border-outline-variant px-4 py-2.5">
                      <span class="text-sm font-medium text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px] text-primary">menu_book</span>{{ m }}
                      </span>
                      <button (click)="quitarModulo(i)" class="text-error hover:bg-error-container rounded-lg p-1.5 transition-colors" title="Quitar" aria-label="Quitar módulo"><span class="material-symbols-outlined text-[16px]">close</span></button>
                    </div>
                  } @empty { <p class="text-sm text-on-surface-variant italic">Sin módulos aún.</p> }
                </div>
                <div class="flex gap-2">
                  <input [(ngModel)]="nuevoModulo" (keydown.enter)="$event.preventDefault(); agregarModulo()" class="campo flex-1" placeholder="Ej: Módulo 1: Fundamentos" />
                  <button (click)="agregarModulo()" class="px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm flex items-center gap-1 shrink-0">
                    <span class="material-symbols-outlined text-[18px]">add</span> Agregar
                  </button>
                </div>
              </div>
            </div>
          </section>
          }

          @if (seccionActiva() === 'requisitos') {
          <section>
            <div class="flex items-center gap-3 mb-2 pb-5 border-b border-outline-variant">
              <span class="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0"><span class="material-symbols-outlined">fact_check</span></span>
              <div>
                <h2 class="font-bold text-on-surface text-lg">Requisitos de documentos</h2>
                <p class="text-xs text-on-surface-variant">Lo que se pide al postulante al cargar documentos, y lo que se muestra como "Requisitos" en la convocatoria pública.</p>
              </div>
            </div>
            <div class="space-y-2 my-6 max-w-2xl">
              @for (r of requisitos(); track r.id) {
                <div class="rounded-xl border border-outline-variant px-5 py-3">
                  <div class="flex items-center gap-2">
                    <p class="font-semibold text-sm text-on-surface">{{ r.nombreDocumento }}</p>
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold" [class]="r.obligatorio ? 'bg-error-container text-on-error-container' : 'bg-surface-high text-on-surface-variant'">{{ r.obligatorio ? 'Obligatorio' : 'Opcional' }}</span>
                  </div>
                  <p class="text-xs text-on-surface-variant mt-1">{{ r.descripcion }} · {{ r.tipoPermitido === 'ENLACE' ? 'Enlace' : 'Archivo' }}</p>
                </div>
              } @empty { <p class="text-sm text-on-surface-variant italic">Sin requisitos aún.</p> }
            </div>
            <div class="grid grid-cols-2 gap-3 bg-surface rounded-xl border border-outline-variant p-4 max-w-2xl">
              <input [(ngModel)]="nuevoReq.nombreDocumento" class="campo col-span-2" placeholder="Nombre del documento (ej: Hoja de vida)" />
              <input [(ngModel)]="nuevoReq.descripcion" class="campo col-span-2" placeholder="Descripción (opcional)" />
              <select [(ngModel)]="nuevoReq.tipoPermitido" class="campo"><option value="PDF">Archivo (PDF, Word o imagen)</option><option value="ENLACE">Enlace</option></select>
              <select [(ngModel)]="nuevoReq.obligatorio" class="campo"><option [ngValue]="true">Obligatorio</option><option [ngValue]="false">Opcional</option></select>
              <button (click)="agregarReq()" class="col-span-2 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[18px]">add</span> Agregar requisito
              </button>
            </div>
          </section>
          }

          @if (seccionActiva() === 'preguntas') {
          <section>
            <div class="flex items-center gap-3 mb-2 pb-5 border-b border-outline-variant">
              <span class="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0"><span class="material-symbols-outlined">quiz</span></span>
              <div>
                <h2 class="font-bold text-on-surface text-lg">Preguntas de postulación</h2>
                <p class="text-xs text-on-surface-variant">El postulante responderá estas preguntas con texto. El evaluador las leerá para calificar los criterios.</p>
              </div>
            </div>
            <div class="space-y-2 my-6 max-w-2xl">
              @for (q of preguntas(); track q.id) {
                <div class="flex items-center justify-between gap-3 rounded-xl border border-outline-variant px-5 py-3">
                  <p class="font-medium text-sm text-on-surface flex-1">{{ q.orden }}. {{ q.enunciado }}</p>
                  <button (click)="eliminarPregunta(q)" class="text-error hover:bg-error-container rounded-lg p-1.5 transition-colors shrink-0" title="Eliminar" aria-label="Eliminar pregunta"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
              } @empty { <p class="text-sm text-on-surface-variant italic">Sin preguntas aún.</p> }
            </div>
            <div class="bg-surface rounded-xl border border-outline-variant p-4 space-y-3 max-w-2xl">
              <textarea [(ngModel)]="nuevaPregunta" rows="2" class="campo w-full" placeholder="Ej: ¿Cuántas veces hiciste voluntariado y cuál te gustó más? Describe tu experiencia."></textarea>
              <button (click)="agregarPregunta()" class="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[18px]">add</span> Agregar pregunta
              </button>
            </div>
          </section>
          }

          @if (seccionActiva() === 'criterios') {
          <section>
            <div class="flex items-center gap-3 mb-2 pb-5 border-b border-outline-variant">
              <span class="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0"><span class="material-symbols-outlined">checklist</span></span>
              <div>
                <h2 class="font-bold text-on-surface text-lg">Criterios de evaluación</h2>
                <p class="text-xs text-on-surface-variant">
                  Son los mismos para todos los programas. Cada uno se califica de 1 a 10, y el puntaje total se ajusta para sumar 100: hay
                  <b>{{ criteriosActivos().length }}</b> activo(s), cada uno vale hasta <b>{{ valorPorCriterio() }}</b> pts.
                </p>
              </div>
            </div>
            <div class="space-y-2 my-6 max-w-2xl">
              @for (c of criterios(); track c.id) {
                <div class="rounded-xl border border-outline-variant px-5 py-3" [class.opacity-50]="!c.activo">
                  @if (editandoCriterioId() === c.id) {
                    <input [(ngModel)]="edicionCriterio.nombreCriterio" class="campo mb-2" placeholder="Nombre" />
                    <input [(ngModel)]="edicionCriterio.descripcion" class="campo mb-3" placeholder="Descripción (opcional)" />
                    <div class="flex gap-2">
                      <button (click)="guardarEdicionCriterio(c)" [disabled]="guardandoCriterio()" class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors">Guardar</button>
                      <button (click)="cancelarEdicionCriterio()" class="px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-high text-xs font-semibold">Cancelar</button>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <p class="font-semibold text-sm text-on-surface">{{ c.orden }}. {{ c.nombreCriterio }}
                          @if (!c.activo) { <span class="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface-high text-on-surface-variant">Inactivo</span> }
                        </p>
                        @if (c.descripcion) { <p class="text-xs text-on-surface-variant mt-0.5">{{ c.descripcion }}</p> }
                      </div>
                      <div class="flex items-center gap-1 shrink-0">
                        <button (click)="iniciarEdicionCriterio(c)" class="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary-fixed text-xs font-semibold transition-colors">Editar</button>
                        @if (c.activo) {
                          <button (click)="desactivarCriterio(c)" class="px-2.5 py-1.5 rounded-lg text-error hover:bg-error-container text-xs font-semibold transition-colors">Desactivar</button>
                        } @else {
                          <button (click)="activarCriterio(c)" class="px-2.5 py-1.5 rounded-lg text-secondary hover:bg-secondary-light text-xs font-semibold transition-colors">Reactivar</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @empty { <p class="text-sm text-on-surface-variant italic">Sin criterios aún.</p> }
            </div>
            <div class="grid grid-cols-2 gap-3 bg-surface rounded-xl border border-outline-variant p-4 max-w-2xl">
              <div class="col-span-2">
                <input [(ngModel)]="nuevoCriterio.nombreCriterio" (ngModelChange)="nombreCriterioInvalido.set(false)"
                  class="campo w-full" [class.campo-invalido]="nombreCriterioInvalido()" placeholder="Nombre del criterio (ej: Trabajo en equipo)" />
                @if (nombreCriterioInvalido()) { <p class="text-xs text-error mt-1">Campo requerido</p> }
              </div>
              <input [(ngModel)]="nuevoCriterio.descripcion" class="campo col-span-2" placeholder="Descripción (opcional)" />
              <button (click)="agregarCriterio()" [disabled]="guardandoCriterio()" class="col-span-2 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[18px]">add</span> Agregar criterio
              </button>
            </div>
          </section>
          }

          <!-- Navegación paso a paso -->
          <div class="flex items-center justify-between pt-6 mt-6 border-t border-outline-variant max-w-2xl">
            @if (indiceActual() > 0) {
              <button (click)="atras()" class="px-4 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-low transition-colors flex items-center gap-1">
                <span class="material-symbols-outlined text-[18px]">arrow_back</span> Atrás
              </button>
            } @else {
              <span></span>
            }
            @if (esUltimaSeccion()) {
              <button (click)="finalizar()" class="px-5 py-2.5 rounded-xl font-bold bg-secondary text-white hover:opacity-90 transition-colors flex items-center gap-2 shadow-card">
                <span class="material-symbols-outlined text-[18px]">check_circle</span> Finalizar
              </button>
            } @else {
              <button (click)="continuar()" [disabled]="guardando()" class="px-5 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2 shadow-card">
                {{ etiquetaContinuar() }} <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            }
          </div>
        </div>
      </div>
    }
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.6rem .8rem; border:1px solid #c5c5d3; border-radius:.65rem; outline:none; font-size:.875rem; transition: all .15s; }
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

  nombreInvalido = signal(false);
  fechaInicioInvalida = signal(false);
  fechaFinInvalida = signal(false);
  cuposInvalidos = signal(false);

  nuevoCriterio = { nombreCriterio: '', descripcion: '' };
  editandoCriterioId = signal<number | null>(null);
  edicionCriterio = { nombreCriterio: '', descripcion: '' };
  guardandoCriterio = signal(false);
  nombreCriterioInvalido = signal(false);

  readonly mensaje: Signal<string | null>;
  readonly mensajeError: Signal<boolean>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private programaService: ProgramaService,
    private criterioService: CriterioService,
    private reqDocService: ReqDocumentoService,
    private preguntaService: PreguntaService,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
  ) {
    this.mensaje = toast.mensaje;
    this.mensajeError = toast.esError;
  }

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

    const pasoQuery = this.route.snapshot.queryParamMap.get('paso') as SeccionId | null;
    if (pasoQuery && this.secciones.some(s => s.id === pasoQuery)) {
      this.seccionActiva.set(pasoQuery);
    }

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

  badgeEstado = badgePrograma;

  irASeccion(id: SeccionId): void {
    const s = this.secciones.find(x => x.id === id);
    if (s?.requiereId && !this.idPrograma()) return;
    this.seccionActiva.set(id);
  }

  indiceActual(): number {
    return this.secciones.findIndex(s => s.id === this.seccionActiva());
  }

  esUltimaSeccion(): boolean {
    return this.indiceActual() === this.secciones.length - 1;
  }

  etiquetaContinuar(): string {
    if (this.guardando()) return 'Guardando...';
    return (this.seccionActiva() === 'datos' || this.seccionActiva() === 'descripcion') ? 'Guardar y continuar' : 'Continuar';
  }

  atras(): void {
    const anterior = this.secciones[this.indiceActual() - 1];
    if (anterior) this.seccionActiva.set(anterior.id);
  }

  continuar(): void {
    const siguiente = this.secciones[this.indiceActual() + 1];
    if (this.seccionActiva() === 'datos' || this.seccionActiva() === 'descripcion') {
      this.guardarDatos(siguiente?.id);
    } else if (siguiente) {
      this.seccionActiva.set(siguiente.id);
    }
  }

  finalizar(): void {
    this.router.navigate(['/admin/programas']);
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

  guardarDatos(avanzarA?: SeccionId): void {
    this.nombreInvalido.set(!this.form.nombre.trim());
    this.fechaInicioInvalida.set(!this.form.fechaInicio);
    this.fechaFinInvalida.set(!this.form.fechaFin);
    this.cuposInvalidos.set(!this.form.cuposDisponibles || this.form.cuposDisponibles < 1);
    if (this.nombreInvalido() || this.fechaInicioInvalida() || this.fechaFinInvalida() || this.cuposInvalidos()) {
      return;
    }

    this.guardando.set(true);
    const id = this.idPrograma();
    const obs = id ? this.programaService.actualizar(id, this.form) : this.programaService.crear(this.form);
    obs.subscribe({
      next: (p) => {
        this.guardando.set(false);
        if (id) {
          this.programa.set(p);
          this.notificar('Programa actualizado', false);
          if (avanzarA) this.seccionActiva.set(avanzarA);
        } else {
          this.notificar('Programa creado. Ahora completa el resto de la convocatoria.', false);
          this.router.navigate(['/admin/programas', p.id], avanzarA ? { queryParams: { paso: avanzarA } } : undefined);
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
    this.toast.notificar(msg, error);
  }
}
