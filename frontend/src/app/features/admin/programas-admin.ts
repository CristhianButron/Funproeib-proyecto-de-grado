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
      <div class="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <!-- Búsqueda -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-3 mb-4 flex items-center gap-2">
      <span class="material-symbols-outlined text-outline">search</span>
      <input [(ngModel)]="busqueda" (ngModelChange)="busquedaSignal.set($event)" class="flex-1 outline-none text-sm" placeholder="Buscar por nombre o tipo..." />
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
      @if (cargando()) {
        <p class="p-6 text-on-surface-variant">Cargando...</p>
      } @else {
        <table class="w-full text-left">
          <thead class="bg-surface-low">
            <tr>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Programa</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Tipo</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Fechas</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-center">Cupos</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Estado</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            @for (p of programasFiltrados(); track p.id) {
              <tr class="hover:bg-surface-low transition-colors">
                <td class="px-6 py-4 font-semibold text-primary">{{ p.nombre }}</td>
                <td class="px-6 py-4 text-sm text-on-surface-variant">{{ p.tipo }}</td>
                <td class="px-6 py-4 text-sm">{{ p.fechaInicio }} → {{ p.fechaFin }}</td>
                <td class="px-6 py-4 text-center font-bold">{{ p.cuposDisponibles }}</td>
                <td class="px-6 py-4">
                  <select [ngModel]="p.estado" (ngModelChange)="cambiarEstado(p, $event)"
                    class="text-xs font-bold rounded-full px-3 py-1 border-0 cursor-pointer" [class]="badge(p.estado)">
                    <option value="BORRADOR">BORRADOR</option>
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="ABIERTO">ABIERTO</option>
                    <option value="CERRADO">CERRADO</option>
                  </select>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center gap-1 justify-end">
                    <button (click)="abrirEditar(p)" class="px-2 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-high transition-colors text-sm font-semibold flex items-center gap-1" title="Editar">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button (click)="configurar(p)" class="px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed transition-colors text-sm font-semibold flex items-center gap-1">
                      <span class="material-symbols-outlined text-[18px]">tune</span> Configurar
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="px-6 py-10 text-center text-on-surface-variant">No hay programas que coincidan.</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
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
                    <p class="text-xs text-on-surface-variant">{{ r.descripcion }} · {{ r.tipoPermitido }}</p>
                  </div>
                </div>
              } @empty { <p class="text-sm text-on-surface-variant">Sin requisitos aún.</p> }
            </div>
            <div class="grid grid-cols-2 gap-2 bg-surface rounded-lg p-3">
              <input [(ngModel)]="nuevoReq.nombreDocumento" class="campo col-span-2" placeholder="Nombre del documento (ej: Hoja de vida)" />
              <input [(ngModel)]="nuevoReq.descripcion" class="campo col-span-2" placeholder="Descripción (opcional)" />
              <select [(ngModel)]="nuevoReq.tipoPermitido" class="campo"><option value="PDF">PDF</option><option value="ENLACE">Enlace</option></select>
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
            <div class="space-y-2 mb-4">
              @for (c of criterios(); track c.id) {
                <div class="flex items-center justify-between bg-surface-low rounded-lg px-4 py-2">
                  <div>
                    <p class="font-semibold text-sm">{{ c.nombreCriterio }}</p>
                    <p class="text-xs text-on-surface-variant">{{ c.descripcion }}</p>
                  </div>
                  <span class="text-sm font-bold text-primary">Peso: {{ c.peso }}</span>
                </div>
              } @empty { <p class="text-sm text-on-surface-variant">Sin criterios aún.</p> }
            </div>
            <div class="grid grid-cols-2 gap-2 bg-surface rounded-lg p-3">
              <input [(ngModel)]="nuevoCrit.nombreCriterio" class="campo col-span-2" placeholder="Nombre del criterio (ej: Experiencia en voluntariado)" />
              <input [(ngModel)]="nuevoCrit.descripcion" class="campo" placeholder="Descripción" />
              <input type="number" step="0.01" min="0.01" max="100" [(ngModel)]="nuevoCrit.peso" class="campo" placeholder="Peso (ej: 25)" />
              <button (click)="agregarCrit(pc.id)" class="col-span-2 py-2 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 transition-colors text-sm">+ Agregar criterio</button>
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
  requisitos = signal<ReqDocumentoResponse[]>([]);
  preguntas = signal<PreguntaResponse[]>([]);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  form: ProgramaRequest = this.vacio();
  nuevoCrit = { nombreCriterio: '', descripcion: '', peso: 10 };
  nuevoReq: { nombreDocumento: string; descripcion: string; tipoPermitido: 'PDF' | 'ENLACE'; obligatorio: boolean } =
    { nombreDocumento: '', descripcion: '', tipoPermitido: 'PDF', obligatorio: true };
  nuevaPregunta = '';

  constructor(
    private programaService: ProgramaService,
    private criterioService: CriterioService,
    private reqDocService: ReqDocumentoService,
    private preguntaService: PreguntaService,
  ) {}

  ngOnInit(): void { this.cargar(); }

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
    this.criterios.set([]); this.requisitos.set([]); this.preguntas.set([]);
    this.criterioService.listarPorPrograma(p.id).subscribe(c => this.criterios.set(c));
    this.reqDocService.listarPorPrograma(p.id).subscribe(r => this.requisitos.set(r));
    this.preguntaService.listarPorPrograma(p.id).subscribe(q => this.preguntas.set(q));
  }

  agregarCrit(idPrograma: number): void {
    if (!this.nuevoCrit.nombreCriterio) return;
    this.criterioService.crear({ idPrograma, ...this.nuevoCrit }).subscribe({
      next: (c) => { this.criterios.update(l => [...l, c]); this.nuevoCrit = { nombreCriterio: '', descripcion: '', peso: 10 }; },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al agregar criterio', true),
    });
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

  badge(estado: string): string {
    const map: Record<string, string> = {
      BORRADOR: 'bg-surface-high text-on-surface-variant',
      ACTIVO: 'bg-primary-fixed text-primary',
      ABIERTO: 'bg-secondary-light text-on-secondary-container',
      CERRADO: 'bg-error-container text-on-error-container',
    };
    return map[estado] ?? '';
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
