import { Component, OnInit, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostulacionService } from '../../core/services/postulacion.service';
import { DocumentoService } from '../../core/services/documento.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ReqDocumentoService } from '../../core/services/reqdoc.service';
import { PreguntaService, RespuestaService } from '../../core/services/pregunta.service';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { PostulacionResponse } from '../../core/models/postulacion.model';
import { DocumentoResponse, ReqDocumentoResponse, TipoDocumento } from '../../core/models/documento.model';
import { PreguntaResponse, RespuestaResponse } from '../../core/models/pregunta.model';
import { EvaluacionResponse } from '../../core/models/evaluacion.model';
import { ToastService } from '../../core/services/toast.service';
import { badgePostulacion } from '../../core/utils/estado-colores';

@Component({
  selector: 'app-portal-postulacion-detalle',
  imports: [FormsModule, RouterLink],
  template: `
  <div class="max-w-3xl mx-auto">
    <nav class="text-xs text-on-surface-variant mb-4 flex items-center gap-1">
      <a routerLink="/portal/mis-postulaciones" class="hover:underline hover:text-primary transition-colors">Mis postulaciones</a>
      <span class="material-symbols-outlined text-[14px]">chevron_right</span>
      <span class="font-semibold text-on-surface truncate">{{ postulacion()?.nombrePrograma || '...' }}</span>
    </nav>

    @if (cargando()) {
      <p class="text-on-surface-variant py-10 text-center">Cargando...</p>
    } @else if (postulacion(); as po) {
      <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
        <div class="px-6 py-4 flex items-center justify-between border-b border-outline-variant">
          <div>
            <h1 class="font-bold text-primary text-lg">{{ po.nombrePrograma }}</h1>
            <p class="text-xs text-on-surface-variant">Postulado el {{ po.fechaPostulacion }}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badge(po.estado)">{{ po.estado }}</span>
        </div>
        <div class="p-6 space-y-6">

          <!-- Documentos -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-semibold text-on-surface">Documentos requeridos</p>
              @if (requisitos().length > 0) {
                <span class="text-xs text-on-surface-variant">{{ docsCargados() }}/{{ docsObligatorios() }} obligatorios</span>
              }
            </div>
            <div class="space-y-2">
              @for (req of requisitos(); track req.id) {
                <div class="flex items-center justify-between gap-3 bg-surface-low rounded-lg px-4 py-3">
                  <div class="flex-1">
                    <p class="text-sm font-semibold">{{ req.nombreDocumento }}
                      <span class="text-xs ml-1" [class]="req.obligatorio ? 'text-error' : 'text-on-surface-variant'">{{ req.obligatorio ? '(obligatorio)' : '(opcional)' }}</span>
                    </p>
                    <p class="text-xs text-on-surface-variant">{{ req.descripcion }} · {{ labelTipo(req.tipoPermitido) }}</p>
                  </div>
                  @if (docDe(req.id); as doc) {
                    <div class="flex items-center gap-2">
                      <span class="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1" [class]="doc.verificado ? 'bg-secondary-light text-on-secondary-container' : 'bg-primary-fixed text-primary'">
                        <span class="material-symbols-outlined text-[16px]">{{ doc.verificado ? 'verified' : 'schedule' }}</span>
                        {{ doc.verificado ? 'Verificado' : 'Cargado' }}
                      </span>
                      <button type="button" (click)="verDocumento(doc)" class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">visibility</span> Ver
                      </button>
                      @if (esEditable() && !doc.verificado) {
                        <button type="button" (click)="quitarDocumento(doc)" class="text-xs font-semibold text-error hover:underline flex items-center gap-1">
                          <span class="material-symbols-outlined text-[16px]">delete</span> Quitar
                        </button>
                      }
                    </div>
                  } @else if (esEditable()) {
                    @if (req.tipoPermitido === 'PDF') {
                      <div>
                        <div class="flex items-center gap-2">
                          <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" (change)="archivoSeleccionado($event, req)" class="text-xs w-48" />
                          <button (click)="subirArchivo(req)" [disabled]="subiendo[req.id]"
                            class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors disabled:opacity-50">
                            {{ subiendo[req.id] ? 'Subiendo...' : 'Subir' }}
                          </button>
                        </div>
                        @if (erroresCampo['doc-' + req.id]) { <p class="text-xs text-error mt-1">Selecciona un archivo primero</p> }
                      </div>
                    } @else {
                      <div>
                        <div class="flex items-center gap-2">
                          <input [(ngModel)]="rutas[req.id]" (ngModelChange)="erroresCampo['doc-' + req.id] = false"
                            class="campo w-44" [class.campo-invalido]="erroresCampo['doc-' + req.id]" placeholder="https://..." />
                          <button (click)="subirEnlace(req)" class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors">Subir</button>
                        </div>
                        @if (erroresCampo['doc-' + req.id]) { <p class="text-xs text-error mt-1">Campo requerido</p> }
                      </div>
                    }
                  } @else {
                    <span class="text-xs text-error font-semibold">No cargado</span>
                  }
                </div>
              } @empty { <p class="text-sm text-on-surface-variant">Este programa no definió requisitos.</p> }
            </div>
          </div>

          <!-- Preguntas -->
          @if (preguntas().length > 0) {
            <div>
              <p class="text-sm font-semibold text-on-surface mb-3">Preguntas de postulación</p>
              <div class="space-y-3">
                @for (q of preguntas(); track q.id) {
                  <div class="bg-surface-low rounded-lg p-3">
                    <p class="text-sm font-semibold text-primary mb-2">{{ q.orden }}. {{ q.enunciado }}</p>
                    @if (respuestas()[q.id] && !editando[q.id]) {
                      <p class="text-sm whitespace-pre-line">{{ respuestas()[q.id].respuesta }}</p>
                      @if (esEditable()) {
                        <div class="flex justify-end gap-3 mt-2">
                          <button (click)="iniciarEdicion(q)" class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">edit</span> Editar
                          </button>
                          <button (click)="eliminarRespuesta(q)" class="text-xs font-semibold text-error hover:underline flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">delete</span> Eliminar
                          </button>
                        </div>
                      }
                    } @else if (esEditable()) {
                      <textarea [(ngModel)]="borradores[q.id]" (ngModelChange)="erroresCampo['preg-' + q.id] = false"
                        rows="3" class="campo w-full" [class.campo-invalido]="erroresCampo['preg-' + q.id]" placeholder="Escribe tu respuesta..."></textarea>
                      @if (erroresCampo['preg-' + q.id]) { <p class="text-xs text-error mt-1">Campo requerido</p> }
                      <div class="flex justify-end gap-3 mt-2">
                        @if (respuestas()[q.id]) {
                          <button (click)="cancelarEdicion(q)" class="px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-high text-xs font-semibold">Cancelar</button>
                        }
                        <button (click)="responder(q)" class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors">Guardar respuesta</button>
                      </div>
                    } @else {
                      <p class="text-sm whitespace-pre-line">{{ respuestas()[q.id]?.respuesta || '(sin respuesta)' }}</p>
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
          @if (resultado(); as ev) {
            <div class="rounded-lg p-4" [class]="po.estado === 'RECHAZADA' ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
              <p class="font-bold flex items-center gap-2">
                <span class="material-symbols-outlined">grading</span>
                Resultado: {{ po.estado }}
              </p>
              <p class="text-sm mt-2">Puntaje obtenido: <span class="font-bold text-xl">{{ ev.puntajeTotal }}</span> / {{ ev.puntajeMaximo }}</p>
              <div class="mt-2 space-y-1">
                @for (d of ev.detalles; track d.id) {
                  <div class="flex justify-between text-sm"><span>{{ d.nombreCriterio }}</span><span class="font-bold">{{ d.puntaje }}/10</span></div>
                }
              </div>
              @if (ev.observaciones) { <p class="text-sm mt-2 italic">"{{ ev.observaciones }}"</p> }
            </div>
          }
        </div>
      </div>
    }
  </div>
  `,
  styles: [`
    .campo { padding:.4rem .6rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.85rem; }
    .campo:focus { border-color:#1d4e74; box-shadow:0 0 0 2px rgba(29,78,116,.2); }
    .campo-invalido { border-color:#ba1a1a; }
  `],
})
export class PortalPostulacionDetalleComponent implements OnInit {
  postulacion = signal<PostulacionResponse | null>(null);
  cargando = signal(true);
  readonly mensaje: Signal<string | null>;
  readonly mensajeError: Signal<boolean>;

  requisitos = signal<ReqDocumentoResponse[]>([]);
  documentos = signal<DocumentoResponse[]>([]);
  preguntas = signal<PreguntaResponse[]>([]);
  respuestas = signal<Record<number, RespuestaResponse>>({});
  resultado = signal<EvaluacionResponse | undefined>(undefined);

  editando: Record<number, boolean> = {};
  borradores: Record<number, string> = {};
  rutas: Record<number, string> = {};
  archivos: Record<number, File> = {};
  subiendo: Record<number, boolean> = {};
  erroresCampo: Record<string, boolean> = {};

  private idPostulacion!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postulacionService: PostulacionService,
    private documentoService: DocumentoService,
    private reqDocService: ReqDocumentoService,
    private preguntaService: PreguntaService,
    private respuestaService: RespuestaService,
    private evaluacionService: EvaluacionService,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
  ) {
    this.mensaje = toast.mensaje;
    this.mensajeError = toast.esError;
  }

  ngOnInit(): void {
    const idParam = Number(this.route.snapshot.paramMap.get('id'));
    if (!idParam) { this.router.navigate(['/portal/mis-postulaciones']); return; }
    this.idPostulacion = idParam;

    this.postulacionService.obtenerPorId(idParam).subscribe({
      next: (po) => {
        this.postulacion.set(po);
        this.cargando.set(false);
        this.cargarDependencias(po);
      },
      error: () => { this.cargando.set(false); this.router.navigate(['/portal/mis-postulaciones']); },
    });
  }

  private cargarDependencias(po: PostulacionResponse): void {
    this.reqDocService.listarPorPrograma(po.idPrograma).subscribe(r => this.requisitos.set(r));
    this.documentoService.listarPorPostulacion(po.id).subscribe(d => this.documentos.set(d));
    this.preguntaService.listarPorPrograma(po.idPrograma).subscribe(q => this.preguntas.set(q));
    this.respuestaService.listarPorPostulacion(po.id).subscribe(rs => {
      const mapa: Record<number, RespuestaResponse> = {};
      rs.forEach(r => { mapa[r.idPregunta] = r; this.borradores[r.idPregunta] = r.respuesta; });
      this.respuestas.set(mapa);
    });
    if (['EVALUADA', 'ACEPTADA', 'RECHAZADA'].includes(po.estado)) {
      this.evaluacionService.obtenerPorPostulacion(po.id).subscribe({
        next: (ev) => this.resultado.set(ev),
        error: () => {},
      });
    }
  }

  esEditable(): boolean {
    const po = this.postulacion();
    return !!po && (po.estado === 'INCOMPLETA' || po.estado === 'PENDIENTE');
  }

  docDe(idReq: number): DocumentoResponse | undefined {
    return this.documentos().find(d => d.idReqDocumento === idReq);
  }

  docsCargados(): number {
    return this.requisitos().filter(r => r.obligatorio && this.docDe(r.id)).length;
  }
  docsObligatorios(): number {
    return this.requisitos().filter(r => r.obligatorio).length;
  }

  subirEnlace(req: ReqDocumentoResponse): void {
    const ruta = this.rutas[req.id];
    if (!ruta) { this.erroresCampo['doc-' + req.id] = true; return; }
    this.documentoService.registrar({ idPostulacion: this.idPostulacion, idReqDocumento: req.id, rutaArchivo: ruta, tipo: req.tipoPermitido as TipoDocumento })
      .subscribe({
        next: (doc) => {
          this.documentos.update(l => [...l, doc]);
          this.refrescarEstado();
          this.notificar('Documento cargado', false);
        },
        error: (err) => this.notificar(err.error?.mensaje || 'Error al subir documento', true),
      });
  }

  archivoSeleccionado(event: Event, req: ReqDocumentoResponse): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (archivo) this.archivos[req.id] = archivo;
  }

  subirArchivo(req: ReqDocumentoResponse): void {
    const archivo = this.archivos[req.id];
    if (!archivo) { this.erroresCampo['doc-' + req.id] = true; return; }
    this.subiendo[req.id] = true;
    this.documentoService.subirArchivo(this.idPostulacion, req.id, archivo).subscribe({
      next: (doc) => {
        delete this.subiendo[req.id];
        delete this.archivos[req.id];
        this.documentos.update(l => [...l, doc]);
        this.refrescarEstado();
        this.notificar('Documento cargado', false);
      },
      error: (err) => {
        delete this.subiendo[req.id];
        this.notificar(err.error?.mensaje || 'Error al subir el archivo', true);
      },
    });
  }

  async quitarDocumento(doc: DocumentoResponse): Promise<void> {
    const confirmado = await this.confirmDialog.confirmar({
      titulo: 'Quitar documento',
      mensaje: '¿Quitar este documento? Vas a tener que volver a subirlo.',
      textoConfirmar: 'Quitar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.documentoService.eliminar(doc.id).subscribe({
      next: () => {
        this.documentos.update(l => l.filter(d => d.id !== doc.id));
        this.refrescarEstado();
        this.notificar('Documento eliminado. Ya puedes volver a subirlo.', false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo eliminar el documento', true),
    });
  }

  // El endpoint para ver el archivo exige el JWT de quien lo pide (ver
  // DocumentoController): un <a href> normal no manda ese header, así que
  // hay que pedirlo por HttpClient y abrir el blob resultante.
  verDocumento(doc: DocumentoResponse): void {
    if (doc.tipo === 'ENLACE') {
      window.open(doc.rutaArchivo, '_blank', 'noopener');
      return;
    }
    this.documentoService.obtenerArchivo(doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: () => this.notificar('No se pudo abrir el archivo.', true),
    });
  }

  labelTipo(tipo: string): string {
    return tipo === 'ENLACE' ? 'Enlace' : 'Archivo (PDF, Word o imagen)';
  }

  iniciarEdicion(q: PreguntaResponse): void {
    this.borradores[q.id] = this.respuestas()[q.id]?.respuesta ?? '';
    this.editando[q.id] = true;
  }

  cancelarEdicion(q: PreguntaResponse): void {
    this.borradores[q.id] = this.respuestas()[q.id]?.respuesta ?? '';
    this.editando[q.id] = false;
  }

  responder(q: PreguntaResponse): void {
    const texto = this.borradores[q.id];
    if (!texto || !texto.trim()) { this.erroresCampo['preg-' + q.id] = true; return; }
    this.respuestaService.guardar({ idPostulacion: this.idPostulacion, idPregunta: q.id, respuesta: texto }).subscribe({
      next: (r) => {
        this.respuestas.update(m => ({ ...m, [q.id]: r }));
        this.editando[q.id] = false;
        this.refrescarEstado();
        this.notificar('Respuesta guardada', false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al guardar respuesta', true),
    });
  }

  async eliminarRespuesta(q: PreguntaResponse): Promise<void> {
    const respuesta = this.respuestas()[q.id];
    if (!respuesta) return;
    const confirmado = await this.confirmDialog.confirmar({
      titulo: 'Eliminar respuesta',
      mensaje: '¿Eliminar esta respuesta? Vas a tener que volver a escribirla.',
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.respuestaService.eliminar(respuesta.id).subscribe({
      next: () => {
        this.respuestas.update(m => { const copia = { ...m }; delete copia[q.id]; return copia; });
        this.borradores[q.id] = '';
        this.refrescarEstado();
        this.notificar('Respuesta eliminada', false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo eliminar la respuesta', true),
    });
  }

  private refrescarEstado(): void {
    this.postulacionService.obtenerPorId(this.idPostulacion).subscribe(actual =>
      this.postulacion.update(p => p ? { ...p, estado: actual.estado } : p));
  }

  badge = badgePostulacion;

  private notificar(msg: string, error: boolean): void {
    this.toast.notificar(msg, error);
  }
}
