import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { DocumentoService } from '../../core/services/documento.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ProgramaResponse } from '../../core/models/programa.model';
import { PostulacionResponse, EstadoAprovechamiento } from '../../core/models/postulacion.model';
import { DocumentoResponse } from '../../core/models/documento.model';
import { UsuarioResponse } from '../../core/models/usuario.model';

const LABEL_APROVECHAMIENTO: Record<EstadoAprovechamiento, string> = {
  PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', REPROBADO: 'Reprobado', ABANDONO: 'Abandono',
};

/**
 * A diferencia de "Postulantes" (que solo maneja el trámite de la
 * postulación: aceptar/rechazar) y de "Reportes" (de solo lectura), acá se
 * registra el estado final de cada BENEFICIARIO (postulante ya aceptado) una
 * vez que termina el programa: Aprobado, Reprobado o Abandono. Lo pueden usar
 * tanto ADMIN como EVALUADOR.
 */
@Component({
  selector: 'app-beneficiarios',
  imports: [FormsModule],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Beneficiarios</h1>
      <p class="text-on-surface-variant">Registra el estado final de los postulantes aceptados en cada programa.</p>
    </div>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-primary">filter_alt</span>
      <select [(ngModel)]="programaSel" (ngModelChange)="cargarBeneficiarios($event)" class="campo max-w-md">
        <option [ngValue]="null">Seleccione un programa...</option>
        @for (p of programas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
      </select>
    </div>

    @if (programaSel) {
      <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
        @if (cargando()) {
          <p class="p-6 text-on-surface-variant">Cargando...</p>
        } @else {
          <p class="px-6 pt-4 text-xs text-on-surface-variant">
            Abandono se puede marcar en cualquier momento. Aprobado/Reprobado solo una vez que el programa finalice{{ programaYaFinalizo() ? '' : ' (' + fechaFinProgramaSel() + ')' }}.
          </p>
          <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-surface-low">
              <tr>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Beneficiario</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Fecha de postulación</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Estado final</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (b of beneficiarios(); track b.id) {
                <tr class="hover:bg-surface-low transition-colors">
                  <td class="px-6 py-4 font-semibold text-primary">{{ b.nombrePostulante }}</td>
                  <td class="px-6 py-4 text-sm">{{ b.fechaPostulacion }}</td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-2">
                      @for (e of estadosAprovechamiento; track e) {
                        <button (click)="actualizarAprovechamiento(b, e)"
                          [disabled]="!programaYaFinalizo() && (e === 'APROBADO' || e === 'REPROBADO')"
                          class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          [class]="b.estadoAprovechamiento === e ? badge(e) + ' border-transparent' : 'border-outline-variant text-on-surface-variant hover:bg-surface-low'">
                          {{ LABEL_APROVECHAMIENTO[e] }}
                        </button>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="verDetalle(b)" class="px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed text-sm font-semibold flex items-center gap-1 ml-auto">
                      <span class="material-symbols-outlined text-[18px]">badge</span> Ver ficha
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="px-6 py-10 text-center text-on-surface-variant">Este programa todavía no tiene beneficiarios (postulantes aceptados).</td></tr>
              }
            </tbody>
          </table>
          </div>
        }
      </div>
    }
  </div>

  <!-- Ficha del beneficiario -->
  @if (beneficiarioSel(); as b) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="cerrar()">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <h2 class="font-bold text-lg flex items-center gap-2"><span class="material-symbols-outlined">badge</span> Ficha del beneficiario</h2>
          <button (click)="cerrar()" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-6 overflow-y-auto custom-scrollbar space-y-6">
          @if (perfil(); as u) {
            <div class="grid grid-cols-2 gap-4">
              <div><p class="text-xs text-on-surface-variant uppercase">Nombre</p><p class="font-semibold">{{ u.nombreCompleto }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">CI</p><p class="font-semibold">{{ u.ci }}{{ u.ciExtension ? ' ' + u.ciExtension : '' }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Correo</p><p class="font-semibold">{{ u.correo }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Edad</p><p class="font-semibold">{{ u.edad }} años</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Género</p><p class="font-semibold">{{ u.genero }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Nivel educativo</p><p class="font-semibold">{{ u.nivelEducativo }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Autoidentificación</p><p class="font-semibold">{{ u.autoidentificacionEtnica || '—' }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Estado civil</p><p class="font-semibold">{{ u.estadoCivil || '—' }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Lugar de nacimiento</p><p class="font-semibold">{{ u.ciudadNacimiento }}{{ u.paisNacimiento ? ', ' + u.paisNacimiento : '' }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Provincia de nacimiento</p><p class="font-semibold">{{ u.provinciaNacimiento || '—' }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Ciudad actual de residencia</p><p class="font-semibold">{{ u.ciudad }}{{ u.pais ? ', ' + u.pais : '' }}</p></div>
              <div class="col-span-2"><p class="text-xs text-on-surface-variant uppercase">Dirección de domicilio</p><p class="font-semibold">{{ u.direccionDomicilio || '—' }}</p></div>
              @if (u.carreras && u.carreras.length > 0) {
                <div class="col-span-2">
                  <p class="text-xs text-on-surface-variant uppercase">Carrera o profesión</p>
                  <p class="font-semibold">{{ u.carreras.join(', ') }}</p>
                </div>
              }
            </div>
          }

          <section>
            <h3 class="font-bold text-primary-dark flex items-center gap-2 mb-3"><span class="material-symbols-outlined">folder</span> Documentos</h3>
            <div class="space-y-2">
              @for (d of documentos(); track d.id) {
                <div class="flex items-center justify-between bg-surface-low rounded-lg px-4 py-2">
                  <div>
                    <p class="font-semibold text-sm">{{ d.nombreReqDocumento }}</p>
                    <p class="text-xs text-on-surface-variant">{{ d.tipo === 'ENLACE' ? 'Enlace' : 'Archivo' }} · {{ d.fechaCarga }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button type="button" (click)="verDocumento(d)" class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">visibility</span> Ver
                    </button>
                    @if (d.verificado) {
                      <span class="px-3 py-1 rounded-full text-xs font-bold bg-secondary-light text-on-secondary-container flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">verified</span> Verificado
                      </span>
                    }
                  </div>
                </div>
              } @empty {
                <p class="text-sm text-on-surface-variant">Sin documentos cargados.</p>
              }
            </div>
          </section>

          <section class="border-t border-outline-variant pt-4">
            <h3 class="font-bold text-primary-dark mb-3">Estado final</h3>
            <div class="flex flex-wrap gap-2">
              @for (e of estadosAprovechamiento; track e) {
                <button (click)="actualizarAprovechamiento(b, e)"
                  [disabled]="!programaYaFinalizo() && (e === 'APROBADO' || e === 'REPROBADO')"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  [class]="b.estadoAprovechamiento === e ? badge(e) + ' border-transparent' : 'border-outline-variant text-on-surface-variant hover:bg-surface-low'">
                  {{ LABEL_APROVECHAMIENTO[e] }}
                </button>
              }
            </div>
          </section>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#9a4a2e; box-shadow:0 0 0 2px rgba(154,74,46,.2); }
  `],
})
export class BeneficiariosComponent implements OnInit {
  LABEL_APROVECHAMIENTO = LABEL_APROVECHAMIENTO;
  estadosAprovechamiento: EstadoAprovechamiento[] = ['PENDIENTE', 'ABANDONO', 'APROBADO', 'REPROBADO'];

  programas = signal<ProgramaResponse[]>([]);
  beneficiarios = signal<PostulacionResponse[]>([]);
  programaSel: number | null = null;
  cargando = signal(false);

  beneficiarioSel = signal<PostulacionResponse | null>(null);
  perfil = signal<UsuarioResponse | null>(null);
  documentos = signal<DocumentoResponse[]>([]);

  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  constructor(
    private programaService: ProgramaService,
    private postulacionService: PostulacionService,
    private documentoService: DocumentoService,
    private usuarioService: UsuarioService,
  ) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe(d => this.programas.set(d));
  }

  programaYaFinalizo(): boolean {
    const p = this.programaSel ? this.programas().find(x => x.id === this.programaSel) : null;
    return !!p && p.fechaFin < new Date().toISOString().slice(0, 10);
  }

  fechaFinProgramaSel(): string {
    const p = this.programaSel ? this.programas().find(x => x.id === this.programaSel) : null;
    return p ? 'finaliza el ' + p.fechaFin : '';
  }

  cargarBeneficiarios(idPrograma: number | null): void {
    if (!idPrograma) { this.beneficiarios.set([]); return; }
    this.cargando.set(true);
    this.postulacionService.listarPorPrograma(idPrograma).subscribe({
      next: (d) => {
        this.beneficiarios.set(d.filter(po => po.estado === 'ACEPTADA'));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  actualizarAprovechamiento(b: PostulacionResponse, estado: EstadoAprovechamiento): void {
    this.postulacionService.registrarAprovechamiento(b.id, estado).subscribe({
      next: (actualizado) => {
        b.estadoAprovechamiento = actualizado.estadoAprovechamiento;
        this.beneficiarios.update(list => [...list]);
      },
      error: (err) => this.notificar(err?.error?.mensaje ?? 'No se pudo actualizar el estado de aprovechamiento.', true),
    });
  }

  verDetalle(b: PostulacionResponse): void {
    this.beneficiarioSel.set(b);
    this.perfil.set(null);
    this.documentos.set([]);
    this.usuarioService.obtenerPorId(b.idUsuario).subscribe(u => this.perfil.set(u));
    this.documentoService.listarPorPostulacion(b.id).subscribe(d => this.documentos.set(d));
  }

  cerrar(): void { this.beneficiarioSel.set(null); }

  // El endpoint para ver el archivo exige el JWT de quien lo pide (ver
  // DocumentoController): un <a href> normal no manda ese header, así que
  // hay que pedirlo por HttpClient y abrir el blob resultante.
  verDocumento(d: DocumentoResponse): void {
    if (d.tipo === 'ENLACE') {
      window.open(d.rutaArchivo, '_blank', 'noopener');
      return;
    }
    this.documentoService.obtenerArchivo(d.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: () => this.notificar('No se pudo abrir el archivo.', true),
    });
  }

  badge(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'bg-surface-high text-on-surface-variant',
      APROBADO: 'bg-secondary-light text-on-secondary-container',
      REPROBADO: 'bg-error-container text-on-error-container',
      ABANDONO: 'bg-primary-fixed text-primary',
    };
    return map[estado] ?? 'bg-surface-high text-on-surface-variant';
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
