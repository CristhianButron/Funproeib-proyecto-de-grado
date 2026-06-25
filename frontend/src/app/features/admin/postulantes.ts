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
              <div><p class="text-xs text-on-surface-variant uppercase">CI</p><p class="font-semibold">{{ u.ci }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Correo</p><p class="font-semibold">{{ u.correo }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Edad</p><p class="font-semibold">{{ u.edad }} años</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Género</p><p class="font-semibold">{{ u.genero }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Nivel educativo</p><p class="font-semibold">{{ u.nivelEducativo }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Autoidentificación</p><p class="font-semibold">{{ u.autoidentificacionEtnica || '—' }}</p></div>
              <div><p class="text-xs text-on-surface-variant uppercase">Procedencia</p><p class="font-semibold">{{ u.paisOrigen }}{{ u.departamentoOrigen ? ', ' + u.departamentoOrigen : '' }}</p></div>
            </div>
          }

          <section>
            <h3 class="font-bold text-primary-dark flex items-center gap-2 mb-3"><span class="material-symbols-outlined">folder</span> Documentos</h3>
            <div class="space-y-2">
              @for (d of documentos(); track d.id) {
                <div class="flex items-center justify-between bg-surface-low rounded-lg px-4 py-2">
                  <div>
                    <p class="font-semibold text-sm">{{ d.nombreReqDocumento }}</p>
                    <p class="text-xs text-on-surface-variant">{{ d.tipo }} · {{ d.fechaCarga }}</p>
                  </div>
                  @if (d.verificado) {
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-secondary-light text-on-secondary-container flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">verified</span> Verificado
                    </span>
                  } @else {
                    <button (click)="verificar(d)" class="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-colors">Verificar</button>
                  }
                </div>
              } @empty {
                <p class="text-sm text-on-surface-variant">El postulante aún no cargó documentos.</p>
              }
            </div>
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

  cambiarEstado(po: PostulacionResponse, estado: EstadoPostulacion): void {
    this.postulacionService.cambiarEstado(po.id, estado).subscribe(actualizado => {
      po.estado = actualizado.estado;
      this.postulaciones.update(list => [...list]);
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
}
