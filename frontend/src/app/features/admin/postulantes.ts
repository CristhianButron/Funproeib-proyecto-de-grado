import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { DocumentoService } from '../../core/services/documento.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ProgramaResponse } from '../../core/models/programa.model';
import { PostulacionResponse, EstadoPostulacion } from '../../core/models/postulacion.model';
import { DocumentoResponse } from '../../core/models/documento.model';
import { UsuarioResponse } from '../../core/models/usuario.model';

@Component({
  selector: 'app-postulantes',
  imports: [FormsModule],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Gestión de postulantes</h1>
      <p class="text-on-surface-variant">Revisa las postulaciones y verifica documentos.</p>
    </div>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-primary">filter_alt</span>
      <select [(ngModel)]="programaSel" (ngModelChange)="cargarPostulaciones($event)" class="campo max-w-md">
        <option [ngValue]="null">Seleccione un programa...</option>
        @for (p of programas(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
      </select>
    </div>

    @if (programaSel) {
      <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
        @if (cargando()) {
          <p class="p-6 text-on-surface-variant">Cargando...</p>
        } @else {
          <table class="w-full text-left">
            <thead class="bg-surface-low">
              <tr>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Postulante</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Fecha</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Estado</th>
                <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (po of postulaciones(); track po.id) {
                <tr class="hover:bg-surface-low transition-colors">
                  <td class="px-6 py-4 font-semibold text-primary">{{ po.nombrePostulante }}</td>
                  <td class="px-6 py-4 text-sm">{{ po.fechaPostulacion }}</td>
                  <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-bold" [class]="badge(po.estado)">{{ po.estado }}</span></td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="verDetalle(po)" class="px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed text-sm font-semibold flex items-center gap-1 ml-auto">
                      <span class="material-symbols-outlined text-[18px]">badge</span> Ver ficha
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="px-6 py-10 text-center text-on-surface-variant">Sin postulaciones para este programa.</td></tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  </div>

  <!-- Ficha del estudiante -->
  @if (postulacionSel(); as ps) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="cerrar()">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <h2 class="font-bold text-lg flex items-center gap-2"><span class="material-symbols-outlined">badge</span> Ficha del postulante</h2>
          <button (click)="cerrar()"><span class="material-symbols-outlined">close</span></button>
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
                    <a [href]="verUrl(d)" target="_blank" rel="noopener" class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">visibility</span> Ver
                    </a>
                    @if (d.verificado) {
                      <span class="px-3 py-1 rounded-full text-xs font-bold bg-secondary-light text-on-secondary-container flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">verified</span> Verificado
                      </span>
                    } @else {
                      <button (click)="verificar(d)" class="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-colors">Verificar</button>
                    }
                  </div>
                </div>
              } @empty {
                <p class="text-sm text-on-surface-variant">El postulante aún no cargó documentos.</p>
              }
            </div>
          </section>

          <section class="border-t border-outline-variant pt-4">
            <h3 class="font-bold text-primary-dark flex items-center gap-2 mb-3"><span class="material-symbols-outlined">fingerprint</span> Verificación de identidad</h3>
            @if (ps.identidadVerificada) {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-secondary-light text-on-secondary-container flex items-center gap-1 w-fit">
                <span class="material-symbols-outlined text-[16px]">verified</span> Identidad verificada
              </span>
            } @else {
              <p class="text-xs text-on-surface-variant mb-3">
                Compara el carnet de identidad (anverso/reverso) cargado por el postulante con sus datos antes de dejarlo avanzar a evaluación.
              </p>
              <div class="flex flex-wrap gap-2">
                <button (click)="verificarIdentidad(ps)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">check_circle</span> Verificar identidad
                </button>
                <button (click)="rechazarIdentidad(ps)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-error text-white hover:opacity-90 transition-colors flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">block</span> Rechazar y eliminar cuenta
                </button>
              </div>
            }
          </section>

          <section class="border-t border-outline-variant pt-4">
            <h3 class="font-bold text-primary-dark mb-3">Cambiar estado de la postulación</h3>
            <div class="flex flex-wrap gap-2">
              @for (e of estados; track e) {
                <button (click)="cambiarEstado(ps, e)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                  [class]="ps.estado === e ? badge(e) + ' border-transparent' : 'border-outline-variant text-on-surface-variant hover:bg-surface-low'">
                  {{ e }}
                </button>
              }
            </div>
            @if (ps.estado === 'ACEPTADA') {
              <p class="text-xs text-on-surface-variant mt-3">
                Una vez aceptado, este postulante pasa a ser beneficiario del programa. Su estado final
                (Aprobado/Reprobado/Abandono) se registra desde <strong>Beneficiarios</strong>, no desde acá.
              </p>
            }
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
export class PostulantesComponent implements OnInit {
  programas = signal<ProgramaResponse[]>([]);
  postulaciones = signal<PostulacionResponse[]>([]);
  programaSel: number | null = null;
  cargando = signal(false);

  postulacionSel = signal<PostulacionResponse | null>(null);
  perfil = signal<UsuarioResponse | null>(null);
  documentos = signal<DocumentoResponse[]>([]);

  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  estados: EstadoPostulacion[] = ['INCOMPLETA', 'PENDIENTE', 'EVALUADA', 'ACEPTADA', 'RECHAZADA', 'BLOQUEADA'];

  constructor(
    private programaService: ProgramaService,
    private postulacionService: PostulacionService,
    private documentoService: DocumentoService,
    private usuarioService: UsuarioService,
  ) {}

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe(d => this.programas.set(d));
  }

  cargarPostulaciones(idPrograma: number | null): void {
    if (!idPrograma) { this.postulaciones.set([]); return; }
    this.cargando.set(true);
    this.postulacionService.listarPorPrograma(idPrograma).subscribe({
      next: (d) => { this.postulaciones.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  verDetalle(po: PostulacionResponse): void {
    this.postulacionSel.set(po);
    this.perfil.set(null);
    this.documentos.set([]);
    this.usuarioService.obtenerPorId(po.idUsuario).subscribe(u => this.perfil.set(u));
    this.documentoService.listarPorPostulacion(po.id).subscribe(d => this.documentos.set(d));
  }

  verificar(d: DocumentoResponse): void {
    this.documentoService.verificar(d.id).subscribe(actualizado => d.verificado = actualizado.verificado);
  }

  verUrl(d: DocumentoResponse): string {
    return d.tipo === 'ENLACE' ? d.rutaArchivo : this.documentoService.urlArchivo(d.id);
  }

  cambiarEstado(po: PostulacionResponse, estado: EstadoPostulacion): void {
    this.postulacionService.cambiarEstado(po.id, estado).subscribe({
      next: (actualizado) => {
        po.estado = actualizado.estado;
        this.postulaciones.update(list => [...list]);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al cambiar el estado', true),
    });
  }

  verificarIdentidad(po: PostulacionResponse): void {
    this.postulacionService.verificarIdentidad(po.id).subscribe({
      next: (actualizado) => {
        po.identidadVerificada = actualizado.identidadVerificada;
        this.postulacionSel.set({ ...po });
        this.notificar('Identidad verificada.', false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al verificar la identidad', true),
    });
  }

  // Elimina la cuenta completa del postulante (ver PostulacionServiceImpl en el
  // backend): por eso hay que confirmar fuerte y luego quitar la postulación
  // de la lista, porque el registro deja de existir.
  rechazarIdentidad(po: PostulacionResponse): void {
    const confirmado = window.confirm(
      `¿Rechazar la identidad de ${po.nombrePostulante}?\n\n` +
      'Esta acción ELIMINA PERMANENTEMENTE su cuenta y todas sus postulaciones, ' +
      'y le envía un correo informando que se detectó un posible intento de falsificación de identidad. No se puede deshacer.'
    );
    if (!confirmado) { return; }

    this.postulacionService.rechazarIdentidad(po.id).subscribe({
      next: () => {
        this.postulaciones.update(list => list.filter(p => p.id !== po.id));
        this.cerrar();
        this.notificar('Cuenta eliminada y correo enviado al postulante.', false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'Error al rechazar la identidad', true),
    });
  }

  cerrar(): void { this.postulacionSel.set(null); }

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
