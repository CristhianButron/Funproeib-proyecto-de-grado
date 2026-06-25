import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { CriterioService } from '../../core/services/criterio.service';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { RespuestaService } from '../../core/services/pregunta.service';
import { AuthService } from '../../core/services/auth.service';
import { ProgramaResponse } from '../../core/models/programa.model';
import { PostulacionResponse, EstadoPostulacion } from '../../core/models/postulacion.model';
import { CriterioEvaluacionResponse, EvaluacionResponse } from '../../core/models/evaluacion.model';
import { RespuestaResponse } from '../../core/models/pregunta.model';

@Component({
  selector: 'app-evaluaciones',
  imports: [FormsModule],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Evaluación de postulantes</h1>
      <p class="text-on-surface-variant">Lee las respuestas del postulante y califica cada criterio del 1 al 5.</p>
    </div>

    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-primary">filter_alt</span>
      <select [(ngModel)]="programaSel" (ngModelChange)="seleccionarPrograma($event)" class="campo max-w-md">
        <option [ngValue]="null">Seleccione un programa...</option>
        @for (p of programas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
      </select>
    </div>

    @if (mensaje()) {
      <div class="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    @if (programaSel) {
      @if (criterios().length === 0) {
        <div class="bg-error-container text-on-error-container rounded-xl p-4 text-sm">
          Este programa no tiene criterios de evaluación. Defínelos en Programas → Configurar.
        </div>
      } @else {
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden h-fit">
            <div class="px-5 py-3 border-b border-outline-variant font-bold text-primary-dark">Postulaciones</div>
            <div class="divide-y divide-outline-variant max-h-[70vh] overflow-y-auto custom-scrollbar">
              @for (po of postulaciones(); track po.id) {
                <button (click)="seleccionar(po)" class="w-full text-left px-5 py-3 hover:bg-surface-low transition-colors flex items-center justify-between"
                  [class.bg-primary-fixed]="postulacionSel()?.id === po.id">
                  <div>
                    <p class="font-semibold text-sm text-primary">{{ po.nombrePostulante }}</p>
                    <p class="text-xs text-on-surface-variant">{{ po.fechaPostulacion }}</p>
                  </div>
                  <span class="px-2 py-1 rounded-full text-xs font-bold" [class]="badge(po.estado)">{{ po.estado }}</span>
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
                  <p class="text-sm mt-2">Puntaje total ponderado: <span class="font-bold text-xl">{{ ev.puntajeTotal }}</span> / 5</p>
                  <div class="mt-3 space-y-1">
                    @for (d of ev.detalles; track d.id) {
                      <div class="flex justify-between text-sm"><span>{{ d.nombreCriterio }}</span><span class="font-bold">{{ d.puntaje }}/5</span></div>
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
              } @else if (ps.estado !== 'PENDIENTE') {
                <div class="bg-surface-low rounded-lg p-4 text-sm text-on-surface-variant">
                  Solo se pueden evaluar postulaciones en estado <b>PENDIENTE</b> (con todos los requisitos y preguntas completados).
                </div>
              } @else {
                <div class="space-y-4">
                  @for (c of criterios(); track c.id) {
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="text-sm font-semibold">{{ c.nombreCriterio }} <span class="text-xs text-on-surface-variant">(peso {{ c.peso }})</span></label>
                        <span class="text-sm font-bold text-primary">{{ puntajes[c.id] || 0 }}/5</span>
                      </div>
                      @if (c.descripcion) { <p class="text-xs text-on-surface-variant mb-1">{{ c.descripcion }}</p> }
                      <input type="range" min="1" max="5" [(ngModel)]="puntajes[c.id]" class="w-full accent-primary" />
                    </div>
                  }
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
    }
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
  `],
})
export class EvaluacionesComponent implements OnInit {
  programas = signal<ProgramaResponse[]>([]);
  postulaciones = signal<PostulacionResponse[]>([]);
  criterios = signal<CriterioEvaluacionResponse[]>([]);
  respuestas = signal<RespuestaResponse[]>([]);
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
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe(d => this.programas.set(d));
  }

  seleccionarPrograma(idPrograma: number | null): void {
    this.postulacionSel.set(null);
    this.criterios.set([]);
    this.postulaciones.set([]);
    if (!idPrograma) return;
    this.criterioService.listarPorPrograma(idPrograma).subscribe(c => this.criterios.set(c));
    this.postulacionService.listarPorPrograma(idPrograma).subscribe(p => this.postulaciones.set(p));
  }

  seleccionar(po: PostulacionResponse): void {
    this.postulacionSel.set(po);
    this.evaluacionExistente.set(null);
    this.respuestas.set([]);
    this.puntajes = {};
    this.observaciones = '';
    this.criterios().forEach(c => this.puntajes[c.id] = 3);
    this.respuestaService.listarPorPostulacion(po.id).subscribe(r => this.respuestas.set(r));
    if (['EVALUADA', 'ACEPTADA', 'RECHAZADA'].includes(po.estado)) {
      this.evaluacionService.obtenerPorPostulacion(po.id).subscribe({
        next: (ev) => this.evaluacionExistente.set(ev),
        error: () => {},
      });
    }
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
        this.notificar('Evaluación registrada. Puntaje: ' + ev.puntajeTotal, false);
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
      PENDIENTE: 'bg-primary-fixed text-primary',
      EVALUADA: 'bg-secondary-light text-on-secondary-container',
      ACEPTADA: 'bg-secondary-light text-on-secondary-container',
      RECHAZADA: 'bg-error-container text-on-error-container',
      BLOQUEADA: 'bg-error-container text-on-error-container',
    };
    return map[estado] ?? 'bg-surface-high text-on-surface-variant';
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 5000);
  }
}
