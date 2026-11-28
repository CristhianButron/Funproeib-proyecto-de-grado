import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { CriterioService } from '../../core/services/criterio.service';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { RespuestaService } from '../../core/services/pregunta.service';
import { DocumentoService } from '../../core/services/documento.service';
import { ReqDocumentoService } from '../../core/services/reqdoc.service';
import { AuthService } from '../../core/services/auth.service';
import { SelectBuscableComponent } from '../../core/components/select-buscable.component';
import { ProgramaResponse } from '../../core/models/programa.model';
import { PostulacionResponse, EstadoPostulacion } from '../../core/models/postulacion.model';
import { CriterioEvaluacionResponse, EvaluacionResponse } from '../../core/models/evaluacion.model';
import { RespuestaResponse } from '../../core/models/pregunta.model';
import { DocumentoResponse, ReqDocumentoResponse } from '../../core/models/documento.model';

@Component({
  selector: 'app-evaluaciones',
  imports: [FormsModule, SelectBuscableComponent],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Evaluación de postulantes</h1>
      <p class="text-on-surface-variant">Lee las respuestas del postulante y califica cada uno de los {{ criterios().length }} criterios activos del 1 al 10. El puntaje se ajusta automáticamente para sumar 100 en total.</p>
    </div>

    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-primary">filter_alt</span>
      <div class="max-w-md flex-1">
        <app-select-buscable [opciones]="opcionesPrograma()" [valor]="programaSel" placeholder="Seleccione un programa..."
          (cambio)="seleccionarPrograma($event)" />
      </div>
    </div>

    @if (programaSel) {
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        @for (e of resumenEstados(); track e.estado) {
          <div class="bg-white p-4 rounded-xl shadow-card border-l-4" [class]="colorBordeResumen(e.estado)">
            <p class="text-[11px] text-on-surface-variant uppercase font-bold">{{ e.estado }}</p>
            <p class="text-2xl font-extrabold" [class]="colorTexto(e.estado)">{{ e.cantidad }}</p>
          </div>
        }
      </div>
    }

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    @if (programaSel) {
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden h-fit">
          <div class="px-5 py-3 border-b border-outline-variant flex items-center justify-between">
            <span class="font-bold text-primary-dark">Postulaciones</span>
            @if (porAtenderCount() > 0) {
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary">{{ porAtenderCount() }} por atender</span>
            }
          </div>
          <div class="divide-y divide-outline-variant max-h-[70vh] overflow-y-auto custom-scrollbar">
            @for (po of postulacionesOrdenadas(); track po.id) {
              <button (click)="seleccionar(po)" class="w-full text-left pl-4 pr-5 py-3 hover:bg-surface-low transition-colors flex items-center gap-3 border-l-4"
                [class]="colorBorde(po.estado)"
                [class.bg-primary-fixed]="postulacionSel()?.id === po.id">
                <span class="material-symbols-outlined text-[20px] shrink-0" [class]="colorTexto(po.estado)">{{ iconoEstado(po.estado) }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm text-primary truncate">{{ po.nombrePostulante }}</p>
                  <p class="text-xs text-on-surface-variant">{{ po.fechaPostulacion }}</p>
                </div>
                <span class="px-2 py-1 rounded-full text-xs font-bold shrink-0" [class]="badge(po.estado)">{{ po.estado }}</span>
              </button>
            } @empty { <p class="px-5 py-8 text-center text-on-surface-variant text-sm">Sin postulaciones.</p> }
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-card border border-outline-variant p-5">
          @if (postulacionSel(); as ps) {
            <h3 class="font-bold text-primary-dark mb-1">{{ ps.nombrePostulante }}</h3>
            <p class="text-sm text-on-surface-variant mb-4">Estado: <span class="font-bold">{{ ps.estado }}</span></p>

            <!-- Respuestas del postulante -->
            @if (respuestas().length > 0) {
              <div class="mb-5">
                <h4 class="text-sm font-bold text-on-surface mb-2 flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">forum</span> Respuestas del postulante</h4>
                <div class="space-y-3">
                  @for (r of respuestas(); track r.id) {
                    <div class="bg-surface-low rounded-lg p-3">
                      <p class="text-xs font-bold text-primary">{{ r.enunciado }}</p>
                      <p class="text-sm mt-1 whitespace-pre-line">{{ r.respuesta || '(sin respuesta)' }}</p>
                    </div>
                  }
                </div>
              </div>
            }

            @if (evaluacionExistente(); as ev) {
              <div class="bg-secondary-light text-on-secondary-container rounded-lg p-4 mb-4">
                <p class="font-bold flex items-center gap-2"><span class="material-symbols-outlined">verified</span> Evaluada</p>
                <p class="text-sm mt-2">Puntaje total: <span class="font-bold text-xl">{{ ev.puntajeTotal }}</span> / {{ ev.puntajeMaximo }}</p>
                <div class="mt-3 space-y-1">
                  @for (d of ev.detalles; track d.id) {
                    <div class="flex justify-between text-sm"><span>{{ d.nombreCriterio }}</span><span class="font-bold">{{ d.puntaje }}/10</span></div>
                  }
                </div>
                @if (ev.observaciones) { <p class="text-sm mt-2 italic">"{{ ev.observaciones }}"</p> }
              </div>

              <!-- Decisión final -->
              @if (ps.estado === 'EVALUADA') {
                <p class="text-sm font-bold text-on-surface mb-2">Decisión final</p>
                <div class="flex gap-3">
                  <button (click)="decidir(ps, 'ACEPTADA')" class="flex-1 py-2.5 rounded-lg bg-secondary text-white font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">check_circle</span> Aceptar
                  </button>
                  <button (click)="decidir(ps, 'RECHAZADA')" class="flex-1 py-2.5 rounded-lg bg-error text-white font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">cancel</span> Rechazar
                  </button>
                </div>
              } @else {
                <div class="p-3 rounded-lg text-sm font-semibold flex items-center gap-2" [class]="badge(ps.estado)">
                  <span class="material-symbols-outlined text-[20px]">{{ ps.estado === 'ACEPTADA' ? 'check_circle' : 'cancel' }}</span>
                  Decisión: {{ ps.estado }}
                </div>
              }
            } @else if (ps.estado === 'ACEPTADA' || ps.estado === 'RECHAZADA') {
              <div class="bg-surface-low rounded-lg p-4 text-sm text-on-surface-variant">
                <p class="font-bold text-on-surface flex items-center gap-2"><span class="material-symbols-outlined text-[20px]">info</span> Sin evaluación registrada</p>
                <p class="mt-1">Esta postulación quedó <b>{{ ps.estado }}</b> sin pasar por este panel de evaluación: seguramente se cambió el estado directamente desde su ficha.</p>
              </div>
            } @else if (ps.estado !== 'PENDIENTE') {
              <div class="bg-surface-low rounded-lg p-4 text-sm text-on-surface-variant">
                Solo se pueden evaluar postulaciones en estado <b>PENDIENTE</b> (con todos los requisitos y preguntas completados).
              </div>
            } @else if (documentosPendientesDeVerificar().length > 0) {
              <div class="bg-primary-fixed text-primary rounded-lg p-4 text-sm">
                <p class="font-bold flex items-center gap-2"><span class="material-symbols-outlined">pending_actions</span> Todavía no se puede evaluar</p>
                <p class="mt-1">Un administrador tiene que verificar estos documentos primero:</p>
                <ul class="mt-2 space-y-1 list-disc list-inside">
                  @for (req of documentosPendientesDeVerificar(); track req.id) {
                    <li>{{ req.nombreDocumento }}</li>
                  }
                </ul>
              </div>
            } @else {
              <div class="space-y-4">
                @for (c of criterios(); track c.id) {
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-sm font-semibold">{{ c.orden }}. {{ c.nombreCriterio }}</label>
                      <span class="text-sm font-bold text-primary">{{ puntajes[c.id] || 0 }}/10 <span class="text-on-surface-variant font-normal">(vale hasta {{ valorPorCriterio() }} pts)</span></span>
                    </div>
                    @if (c.descripcion) { <p class="text-xs text-on-surface-variant mb-1">{{ c.descripcion }}</p> }
                    <input type="range" min="1" max="10" [(ngModel)]="puntajes[c.id]" class="w-full accent-primary" />
                  </div>
                }
                <div class="flex justify-between items-center pt-2 border-t border-outline-variant text-sm font-bold text-primary-dark">
                  <span>Puntaje total</span>
                  <span>{{ puntajeTotalActual() }} / 100</span>
                </div>
                <div>
                  <label class="text-sm font-semibold block mb-1">Observaciones</label>
                  <textarea [(ngModel)]="observaciones" rows="2" class="campo" placeholder="Comentarios de la evaluación..."></textarea>
                </div>
                <button (click)="evaluar(ps)" [disabled]="guardando()"
                  class="w-full py-3 rounded-lg bg-secondary text-white font-bold hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined">fact_check</span>
                  {{ guardando() ? 'Guardando...' : 'Registrar evaluación' }}
                </button>
              </div>
            }
          } @else {
            <div class="text-center py-12 text-on-surface-variant">
              <span class="material-symbols-outlined text-5xl text-outline-variant">touch_app</span>
              <p class="mt-2 text-sm">Selecciona una postulación.</p>
            </div>
          }
        </div>
      </div>
    }
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1d4e74; box-shadow:0 0 0 2px rgba(29,78,116,.2); }
  `],
})
export class EvaluacionesComponent implements OnInit {
  programas = signal<ProgramaResponse[]>([]);
  opcionesPrograma = computed(() => this.programas().map(p => ({ id: p.id, nombre: p.nombre })));
  postulaciones = signal<PostulacionResponse[]>([]);
  criterios = signal<CriterioEvaluacionResponse[]>([]);
  respuestas = signal<RespuestaResponse[]>([]);
  documentos = signal<DocumentoResponse[]>([]);
  requisitos = signal<ReqDocumentoResponse[]>([]);
  programaSel: number | null = null;
  postulacionSel = signal<PostulacionResponse | null>(null);
  evaluacionExistente = signal<EvaluacionResponse | null>(null);
  guardando = signal(false);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  puntajes: Record<number, number> = {};
  observaciones = '';

  constructor(
    private programaService: ProgramaService,
    private postulacionService: PostulacionService,
    private criterioService: CriterioService,
    private evaluacionService: EvaluacionService,
    private respuestaService: RespuestaService,
    private documentoService: DocumentoService,
    private reqDocService: ReqDocumentoService,
    private auth: AuthService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe(d => this.programas.set(d));
    this.criterioService.listarActivos().subscribe(c => this.criterios.set(c));

    // Soporta llegar desde la ficha de una postulación (botón "Evaluar"),
    // que pasa el programa y la postulación a preseleccionar por query param.
    const idPrograma = Number(this.route.snapshot.queryParamMap.get('programa')) || null;
    const idPostulacion = Number(this.route.snapshot.queryParamMap.get('postulacion')) || null;
    if (idPrograma) {
      this.programaSel = idPrograma;
      this.postulacionService.listarPorPrograma(idPrograma).subscribe(p => {
        this.postulaciones.set(p);
        const po = idPostulacion ? p.find(x => x.id === idPostulacion) : undefined;
        if (po) this.seleccionar(po);
      });
    }
  }

  valorPorCriterio(): string {
    const n = this.criterios().length;
    return n > 0 ? (100 / n).toFixed(2) : '0.00';
  }

  seleccionarPrograma(idPrograma: number | null): void {
    this.programaSel = idPrograma;
    this.postulacionSel.set(null);
    this.postulaciones.set([]);
    if (!idPrograma) return;
    this.postulacionService.listarPorPrograma(idPrograma).subscribe(p => this.postulaciones.set(p));
  }

  seleccionar(po: PostulacionResponse): void {
    this.postulacionSel.set(po);
    this.evaluacionExistente.set(null);
    this.respuestas.set([]);
    this.documentos.set([]);
    this.requisitos.set([]);
    this.puntajes = {};
    this.observaciones = '';
    this.criterios().forEach(c => this.puntajes[c.id] = 5);
    this.respuestaService.listarPorPostulacion(po.id).subscribe(r => this.respuestas.set(r));
    this.documentoService.listarPorPostulacion(po.id).subscribe(d => this.documentos.set(d));
    this.reqDocService.listarPorPrograma(po.idPrograma).subscribe(r => this.requisitos.set(r));
    if (['EVALUADA', 'ACEPTADA', 'RECHAZADA'].includes(po.estado)) {
      this.evaluacionService.obtenerPorPostulacion(po.id).subscribe({
        next: (ev) => this.evaluacionExistente.set(ev),
        error: () => {},
      });
    }
  }

  // Documentos obligatorios que todavía no están verificados (o ni
  // siquiera cargados): si hay alguno, el backend rechaza evaluar (ver
  // EvaluacionServiceImpl.validarDocumentosVerificados).
  documentosPendientesDeVerificar = computed(() => {
    const docs = this.documentos();
    return this.requisitos().filter(req => req.obligatorio).filter(req => {
      const doc = docs.find(d => d.idReqDocumento === req.id);
      return !doc || !doc.verificado;
    });
  });

  puntajeTotalActual(): string {
    const n = this.criterios().length;
    if (n === 0) return '0.00';
    const suma = this.criterios().reduce((s, c) => s + (this.puntajes[c.id] || 0), 0);
    return ((suma * 100) / (n * 10)).toFixed(2);
  }

  evaluar(po: PostulacionResponse): void {
    const idEvaluador = this.auth.usuario()?.id;
    if (!idEvaluador) return;
    this.guardando.set(true);
    const detalles = this.criterios().map(c => ({ idCriterio: c.id, puntaje: this.puntajes[c.id] || 1 }));
    this.evaluacionService.evaluar({ idPostulacion: po.id, idEvaluador, observaciones: this.observaciones, detalles }).subscribe({
      next: (ev) => {
        this.guardando.set(false);
        this.actualizarEstadoLocal(po.id, 'EVALUADA');
        this.evaluacionExistente.set(ev);
        this.notificar('Evaluación registrada. Puntaje: ' + ev.puntajeTotal + '/' + ev.puntajeMaximo, false);
      },
      error: (err) => { this.guardando.set(false); this.notificar(err.error?.mensaje || 'Error al evaluar', true); },
    });
  }

  decidir(po: PostulacionResponse, estado: EstadoPostulacion): void {
    this.postulacionService.cambiarEstado(po.id, estado).subscribe({
      next: (a) => { this.actualizarEstadoLocal(po.id, a.estado); this.notificar('Postulación ' + a.estado, false); },
      error: (err) => this.notificar(err.error?.mensaje || 'Error', true),
    });
  }

  private actualizarEstadoLocal(id: number, estado: EstadoPostulacion): void {
    this.postulaciones.update(l => l.map(p => p.id === id ? { ...p, estado } : p));
    const sel = this.postulacionSel();
    if (sel?.id === id) this.postulacionSel.set({ ...sel, estado });
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

  colorBordeResumen(estado: string): string {
    return this.colorBorde(estado);
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

  iconoEstado(estado: string): string {
    const map: Record<string, string> = {
      INCOMPLETA: 'edit_note',
      PENDIENTE: 'hourglass_top',
      EVALUADA: 'fact_check',
      ACEPTADA: 'check_circle',
      RECHAZADA: 'cancel',
      BLOQUEADA: 'block',
    };
    return map[estado] ?? 'help';
  }

  postulacionesOrdenadas = computed(() => {
    const orden: Record<string, number> = { PENDIENTE: 0, EVALUADA: 1, INCOMPLETA: 2, ACEPTADA: 3, RECHAZADA: 4, BLOQUEADA: 5 };
    return [...this.postulaciones()].sort((a, b) => (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9));
  });

  resumenEstados = computed(() => {
    const estados: EstadoPostulacion[] = ['PENDIENTE', 'EVALUADA', 'ACEPTADA', 'RECHAZADA', 'INCOMPLETA'];
    const lista = this.postulaciones();
    return estados.map(estado => ({ estado, cantidad: lista.filter(p => p.estado === estado).length }));
  });

  porAtenderCount = computed(() =>
    this.postulaciones().filter(p => p.estado === 'PENDIENTE' || p.estado === 'EVALUADA').length
  );

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 5000);
  }
}
