import { Component, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostulacionService } from '../../core/services/postulacion.service';
import { DocumentoService } from '../../core/services/documento.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionResponse, EstadoPostulacion, EstadoAprovechamiento } from '../../core/models/postulacion.model';
import { DocumentoResponse } from '../../core/models/documento.model';
import { UsuarioResponse } from '../../core/models/usuario.model';
import { ProgramaResponse } from '../../core/models/programa.model';

const LABEL_APROVECHAMIENTO: Record<EstadoAprovechamiento, string> = {
  PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', REPROBADO: 'Reprobado', ABANDONO: 'Abandono',
};

/**
 * Ficha de una postulación: página propia (ruta /admin|evaluador/postulaciones/:id),
 * no un modal flotante. La usa "Postulantes" (trámite de la postulación:
 * aceptar/rechazar, etc). Una vez ACEPTADA, el "Ver ficha" de "Beneficiarios"
 * ya no apunta acá sino a FichaBeneficiarioComponent, que no muestra el
 * cambio de estado de la postulación (ya no aplica).
 */
@Component({
  selector: 'app-ficha-postulacion',
  imports: [RouterLink],
  template: `
  <div class="max-w-4xl mx-auto">
    <div class="mb-4 flex items-center justify-between flex-wrap gap-2">
      <nav class="flex items-center gap-1.5 text-sm min-w-0" aria-label="Ruta de navegación">
        <a routerLink="../postulantes" class="font-semibold text-on-surface-variant hover:text-primary transition-colors">Postulantes</a>
        <span class="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
        <span class="font-semibold text-on-surface truncate">{{ perfil()?.nombreCompleto || 'Ficha' }}</span>
      </nav>
      <button (click)="volver()" class="text-sm font-semibold text-on-surface-variant hover:text-primary flex items-center gap-1 shrink-0">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span> Volver
      </button>
    </div>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    @if (cargando()) {
      <p class="text-on-surface-variant py-10 text-center">Cargando...</p>
    } @else if (!postulacion()) {
      <div class="bg-white rounded-xl border border-outline-variant p-10 text-center text-on-surface-variant">
        No se encontró la postulación.
      </div>
    } @else {
      <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
        <div class="bg-primary text-white px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div class="min-w-0">
            <h1 class="font-bold text-xl flex items-center gap-2 truncate"><span class="material-symbols-outlined">badge</span> {{ perfil()?.nombreCompleto }}</h1>
            <p class="text-primary-light text-sm mt-1">{{ postulacion()!.nombrePrograma }} · Postulado el {{ postulacion()!.fechaPostulacion }}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/20 shrink-0">{{ postulacion()!.estado }}</span>
        </div>

        <div class="p-6 space-y-8">
          <!-- Datos personales -->
          @if (perfil(); as u) {
            <section>
              <h2 class="text-sm font-bold text-primary uppercase tracking-wide mb-4">Datos personales</h2>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <div><p class="text-xs text-on-surface-variant uppercase">Dirección de domicilio</p><p class="font-semibold">{{ u.direccionDomicilio || '—' }}</p></div>
                @if (u.carreras && u.carreras.length > 0) {
                  <div class="sm:col-span-2 lg:col-span-3">
                    <p class="text-xs text-on-surface-variant uppercase">Carrera o profesión</p>
                    <p class="font-semibold">{{ u.carreras.join(', ') }}</p>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Documentos -->
          <section class="border-t border-outline-variant pt-6">
            <h2 class="text-sm font-bold text-primary uppercase tracking-wide mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">folder</span> Documentos
            </h2>
            <div class="space-y-2">
              @for (d of documentos(); track d.id) {
                <div class="flex items-center justify-between bg-surface-low rounded-lg px-4 py-3">
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
                    } @else {
                      <button (click)="verificar(d)" class="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-colors">Verificar</button>
                    }
                  </div>
                </div>
              } @empty {
                <p class="text-sm text-on-surface-variant">Sin documentos cargados.</p>
              }
            </div>
          </section>

          <!-- Cambiar estado de la postulación -->
          <section class="border-t border-outline-variant pt-6">
            <h2 class="text-sm font-bold text-primary uppercase tracking-wide mb-4">Cambiar estado de la postulación</h2>
            <div class="flex flex-wrap gap-2">
              @for (e of estados; track e) {
                <button (click)="cambiarEstado(e)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                  [class]="postulacion()!.estado === e ? badge(e) + ' border-transparent' : 'border-outline-variant text-on-surface-variant hover:bg-surface-low'">
                  {{ e }}
                </button>
              }
            </div>
          </section>

          <!-- Estado final (aprovechamiento): solo una vez aceptado -->
          @if (postulacion()!.estado === 'ACEPTADA') {
            <section class="border-t border-outline-variant pt-6">
              <h2 class="text-sm font-bold text-primary uppercase tracking-wide mb-2">Estado final (aprovechamiento)</h2>
              <p class="text-xs text-on-surface-variant mb-4">
                Abandono se puede marcar en cualquier momento. Aprobado/Reprobado solo una vez que el programa finalice{{ programaYaFinalizo() ? '' : programaSel() ? ' (finaliza el ' + programaSel()!.fechaFin + ')' : '' }}.
              </p>
              <div class="flex flex-wrap gap-2">
                @for (e of estadosAprovechamiento; track e) {
                  <button (click)="actualizarAprovechamiento(e)"
                    [disabled]="!programaYaFinalizo() && (e === 'APROBADO' || e === 'REPROBADO')"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    [class]="postulacion()!.estadoAprovechamiento === e ? badgeAprovechamiento(e) + ' border-transparent' : 'border-outline-variant text-on-surface-variant hover:bg-surface-low'">
                    {{ LABEL_APROVECHAMIENTO[e] }}
                  </button>
                }
              </div>
            </section>
          }
        </div>
      </div>
    }
  </div>
  `,
})
export class FichaPostulacionComponent implements OnInit {
  LABEL_APROVECHAMIENTO = LABEL_APROVECHAMIENTO;
  estados: EstadoPostulacion[] = ['INCOMPLETA', 'PENDIENTE', 'EVALUADA', 'ACEPTADA', 'RECHAZADA', 'BLOQUEADA'];
  estadosAprovechamiento: EstadoAprovechamiento[] = ['PENDIENTE', 'ABANDONO', 'APROBADO', 'REPROBADO'];

  cargando = signal(true);
  postulacion = signal<PostulacionResponse | null>(null);
  perfil = signal<UsuarioResponse | null>(null);
  documentos = signal<DocumentoResponse[]>([]);
  programaSel = signal<ProgramaResponse | null>(null);

  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private postulacionService: PostulacionService,
    private documentoService: DocumentoService,
    private usuarioService: UsuarioService,
    private programaService: ProgramaService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.cargando.set(false); return; }
    this.cargar(id);
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.postulacionService.obtenerPorId(id).subscribe({
      next: (po) => {
        this.postulacion.set(po);
        this.cargando.set(false);
        this.usuarioService.obtenerPorId(po.idUsuario).subscribe(u => this.perfil.set(u));
        this.documentoService.listarPorPostulacion(po.id).subscribe(d => this.documentos.set(d));
        this.programaService.obtenerPorId(po.idPrograma).subscribe(p => this.programaSel.set(p));
      },
      error: () => this.cargando.set(false),
    });
  }

  programaYaFinalizo(): boolean {
    const p = this.programaSel();
    return !!p && p.fechaFin < new Date().toISOString().slice(0, 10);
  }

  verificar(d: DocumentoResponse): void {
    this.documentoService.verificar(d.id).subscribe({
      next: (actualizado) => { d.verificado = actualizado.verificado; this.notificar('Documento verificado', false); },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo verificar el documento', true),
    });
  }

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

  cambiarEstado(estado: EstadoPostulacion): void {
    const po = this.postulacion();
    if (!po) return;
    this.postulacionService.cambiarEstado(po.id, estado).subscribe({
      next: (actualizado) => { this.postulacion.set(actualizado); this.notificar('Postulación actualizada a ' + actualizado.estado, false); },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo cambiar el estado', true),
    });
  }

  actualizarAprovechamiento(estado: EstadoAprovechamiento): void {
    const po = this.postulacion();
    if (!po) return;
    this.postulacionService.registrarAprovechamiento(po.id, estado).subscribe({
      next: (actualizado) => { this.postulacion.set(actualizado); this.notificar('Estado actualizado a ' + actualizado.estadoAprovechamiento, false); },
      error: (err) => this.notificar(err?.error?.mensaje ?? 'No se pudo actualizar el estado de aprovechamiento.', true),
    });
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

  badgeAprovechamiento(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'bg-surface-high text-on-surface-variant',
      APROBADO: 'bg-secondary-light text-on-secondary-container',
      REPROBADO: 'bg-error-container text-on-error-container',
      ABANDONO: 'bg-primary-fixed text-primary',
    };
    return map[estado] ?? 'bg-surface-high text-on-surface-variant';
  }

  volver(): void {
    this.location.back();
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
