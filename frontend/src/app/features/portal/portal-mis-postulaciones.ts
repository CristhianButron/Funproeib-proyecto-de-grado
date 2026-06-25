import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostulacionService } from '../../core/services/postulacion.service';
import { DocumentoService } from '../../core/services/documento.service';
import { ReqDocumentoService } from '../../core/services/reqdoc.service';
import { PreguntaService, RespuestaService } from '../../core/services/pregunta.service';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { AuthService } from '../../core/services/auth.service';
import { PostulacionResponse } from '../../core/models/postulacion.model';
import { DocumentoResponse, ReqDocumentoResponse, TipoDocumento } from '../../core/models/documento.model';
import { PreguntaResponse, RespuestaResponse } from '../../core/models/pregunta.model';
import { EvaluacionResponse } from '../../core/models/evaluacion.model';

@Component({
  selector: 'app-portal-mis-postulaciones',
  imports: [FormsModule],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Mis postulaciones</h1>
      <p class="text-on-surface-variant">Completa los documentos y las preguntas. Revisa el estado y resultado.</p>
    </div>

    @if (mensaje()) {
      <div class="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    @if (cargando()) {
      <p class="text-on-surface-variant py-10 text-center">Cargando...</p>
    } @else if (postulaciones().length === 0) {
      <div class="text-center py-16 text-on-surface-variant bg-white rounded-xl border border-outline-variant">
        <span class="material-symbols-outlined text-5xl text-outline-variant">assignment</span>
        <p class="mt-3">Aún no tienes postulaciones.</p>
      </div>
    } @else {
      <div class="space-y-5">
        @for (po of postulaciones(); track po.id) {
          <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
            <div class="px-6 py-4 flex items-center justify-between border-b border-outline-variant">
              <div>
                <h3 class="font-bold text-primary">{{ po.nombrePrograma }}</h3>
                <p class="text-xs text-on-surface-variant">Postulado el {{ po.fechaPostulacion }}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badge(po.estado)">{{ po.estado }}</span>
            </div>
            <div class="p-6 space-y-6">

              <!-- Documentos -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <p class="text-sm font-semibold text-on-surface">Documentos requeridos</p>
                  @if (requisitosDe(po.idPrograma).length > 0) {
                    <span class="text-xs text-on-surface-variant">{{ docsCargados(po) }}/{{ docsObligatorios(po) }} obligatorios</span>
                  }
                </div>
                <div class="space-y-2">
                  @for (req of requisitosDe(po.idPrograma); track req.id) {
                    <div class="flex items-center justify-between gap-3 bg-surface-low rounded-lg px-4 py-3">
                      <div class="flex-1">
                        <p class="text-sm font-semibold">{{ req.nombreDocumento }}
                          <span class="text-xs ml-1" [class]="req.obligatorio ? 'text-error' : 'text-on-surface-variant'">{{ req.obligatorio ? '(obligatorio)' : '(opcional)' }}</span>
                        </p>
                        <p class="text-xs text-on-surface-variant">{{ req.descripcion }} · {{ req.tipoPermitido }}</p>
                      </div>
                      @if (docDe(po.id, req.id); as doc) {
                        <span class="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1" [class]="doc.verificado ? 'bg-secondary-light text-on-secondary-container' : 'bg-primary-fixed text-primary'">
                          <span class="material-symbols-outlined text-[16px]">{{ doc.verificado ? 'verified' : 'schedule' }}</span>
                          {{ doc.verificado ? 'Verificado' : 'Cargado' }}
                        </span>
                      } @else if (esEditable(po)) {
                        <div class="flex items-center gap-2">
                          <input [(ngModel)]="rutas[po.id + '-' + req.id]" class="campo w-44" [placeholder]="req.tipoPermitido === 'PDF' ? 'archivo.pdf' : 'https://...'" />
                          <button (click)="subir(po, req)" class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors">Subir</button>
                        </div>
                      } @else {
                        <span class="text-xs text-error font-semibold">No cargado</span>
                      }
                    </div>
                  } @empty { <p class="text-sm text-on-surface-variant">Este programa no definió requisitos.</p> }
                </div>
              </div>

              <!-- Preguntas -->
              @if (preguntasDe(po.idPrograma).length > 0) {
                <div>
                  <p class="text-sm font-semibold text-on-surface mb-3">Preguntas de postulación</p>
                  <div class="space-y-3">
                    @for (q of preguntasDe(po.idPrograma); track q.id) {
                      <div class="bg-surface-low rounded-lg p-3">
                        <p class="text-sm font-semibold text-primary mb-2">{{ q.orden }}. {{ q.enunciado }}</p>
                        @if (esEditable(po)) {
                          <textarea [(ngModel)]="respTexto[po.id + '-' + q.id]" rows="3" class="campo w-full" placeholder="Escribe tu respuesta..."></textarea>
                          <div class="flex justify-end mt-2">
                            <button (click)="responder(po, q)" class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors">Guardar respuesta</button>
                          </div>
                        } @else {
                          <p class="text-sm whitespace-pre-line">{{ respTexto[po.id + '-' + q.id] || '(sin respuesta)' }}</p>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Estado / resultado -->
              @if (po.estado === 'PENDIENTE') {
                <div class="p-3 rounded-lg bg-primary-fixed text-primary text-sm flex items-center gap-2">
                  <span class="material-symbols-outlined text-[20px]">hourglass_top</span>
                  Todo completo. Tu postulación está <b>pendiente de evaluación</b>.
                </div>
              }
              @if (resultadoDe(po.id); as ev) {
                <div class="rounded-lg p-4" [class]="po.estado === 'RECHAZADA' ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
                  <p class="font-bold flex items-center gap-2">
                    <span class="material-symbols-outlined">grading</span>
                    Resultado: {{ po.estado }}
                  </p>
                  <p class="text-sm mt-2">Puntaje obtenido: <span class="font-bold text-xl">{{ ev.puntajeTotal }}</span> / 5</p>
                  <div class="mt-2 space-y-1">
                    @for (d of ev.detalles; track d.id) {
                      <div class="flex justify-between text-sm"><span>{{ d.nombreCriterio }}</span><span class="font-bold">{{ d.puntaje }}/5</span></div>
                    }
                  </div>
                  @if (ev.observaciones) { <p class="text-sm mt-2 italic">"{{ ev.observaciones }}"</p> }
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  </div>
  `,
  styles: [`
    .campo { padding:.4rem .6rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.85rem; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
  `],
})
export class PortalMisPostulacionesComponent implements OnInit {
  postulaciones = signal<PostulacionResponse[]>([]);
  cargando = signal(true);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  requisitosPorPrograma = signal<Record<number, ReqDocumentoResponse[]>>({});
  documentosPorPostulacion = signal<Record<number, DocumentoResponse[]>>({});
  preguntasPorPrograma = signal<Record<number, PreguntaResponse[]>>({});
  evaluacionPorPostulacion = signal<Record<number, EvaluacionResponse>>({});
  rutas: Record<string, string> = {};
  respTexto: Record<string, string> = {};

  constructor(
    private postulacionService: PostulacionService,
    private documentoService: DocumentoService,
    private reqDocService: ReqDocumentoService,
    private preguntaService: PreguntaService,
    private respuestaService: RespuestaService,
    private evaluacionService: EvaluacionService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const idUsuario = this.auth.usuario()?.id;
    if (!idUsuario) { this.cargando.set(false); return; }
    this.postulacionService.listarPorUsuario(idUsuario).subscribe({
      next: (data) => {
        this.postulaciones.set(data);
        this.cargando.set(false);
        data.forEach(po => {
          this.reqDocService.listarPorPrograma(po.idPrograma).subscribe(r =>
            this.requisitosPorPrograma.update(m => ({ ...m, [po.idPrograma]: r })));
          this.documentoService.listarPorPostulacion(po.id).subscribe(d =>
            this.documentosPorPostulacion.update(m => ({ ...m, [po.id]: d })));
          this.preguntaService.listarPorPrograma(po.idPrograma).subscribe(q =>
            this.preguntasPorPrograma.update(m => ({ ...m, [po.idPrograma]: q })));
          this.respuestaService.listarPorPostulacion(po.id).subscribe(rs => {
            rs.forEach(r => this.respTexto[po.id + '-' + r.idPregunta] = r.respuesta);
          });
          if (['EVALUADA', 'ACEPTADA', 'RECHAZADA'].includes(po.estado)) {
            this.evaluacionService.obtenerPorPostulacion(po.id).subscribe({
              next: (ev) => this.evaluacionPorPostulacion.update(m => ({ ...m, [po.id]: ev })),
              error: () => {},
            });
          }
        });
      },
      error: () => this.cargando.set(false),
    });
  }

  esEditable(po: PostulacionResponse): boolean {
    return po.estado === 'INCOMPLETA' || po.estado === 'PENDIENTE';
  }

  requisitosDe(idPrograma: number): ReqDocumentoResponse[] { return this.requisitosPorPrograma()[idPrograma] ?? []; }
  preguntasDe(idPrograma: number): PreguntaResponse[] { return this.preguntasPorPrograma()[idPrograma] ?? []; }
  docDe(idPostulacion: number, idReq: number): DocumentoResponse | undefined {
    return (this.documentosPorPostulacion()[idPostulacion] ?? []).find(d => d.idReqDocumento === idReq);
  }
  resultadoDe(idPostulacion: number): EvaluacionResponse | undefined { return this.evaluacionPorPostulacion()[idPostulacion]; }

  docsCargados(po: PostulacionResponse): number {
    return this.requisitosDe(po.idPrograma).filter(r => r.obligatorio && this.docDe(po.id, r.id)).length;
  }
  docsObligatorios(po: PostulacionResponse): number {
    return this.requisitosDe(po.idPrograma).filter(r => r.obligatorio).length;
  }

  subir(po: PostulacionResponse, req: ReqDocumentoResponse): void {
    const key = po.id + '-' + req.id;
    const ruta = this.rutas[key];
    if (!ruta) { this.notificar('Ingresa la ruta o enlace del documento', true); return; }
    this.documentoService.registrar({ idPostulacion: po.id, idReqDocumento: req.id, rutaArchivo: ruta, tipo: req.tipoPermitido as TipoDocumento })
      .subscribe({
        next: (doc) => {
          this.documentosPorPostulacion.update(m => ({ ...m, [po.id]: [...(m[po.id] ?? []), doc] }));
          this.refrescarEstado(po);
          this.notificar('Documento cargado', false);
        },
        error: (err) => this.notificar(err.error?.mensaje || 'Error al subir documento', true),
      });
  }

  responder(po: PostulacionResponse, q: PreguntaResponse): void {
    const key = po.id + '-' + q.id;
    const texto = this.respTexto[key];
    if (!texto || !texto.trim()) { this.notificar('Escribe una respuesta', true); return; }
    this.respuestaService.guardar({ idPostulacion: po.id, idPregunta: q.id, respuesta: texto }).subscribe({
      next: () => { this.refrescarEstado(po); this.notificar('Respuesta guardada', false); },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al guardar respuesta', true),
    });
  }

  private refrescarEstado(po: PostulacionResponse): void {
    this.postulacionService.obtenerPorId(po.id).subscribe(actual =>
      this.postulaciones.update(l => l.map(p => p.id === po.id ? { ...p, estado: actual.estado } : p)));
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
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
