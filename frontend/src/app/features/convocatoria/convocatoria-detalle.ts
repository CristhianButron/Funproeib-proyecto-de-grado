import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { AuthService } from '../../core/services/auth.service';
import { ProgramaResponse } from '../../core/models/programa.model';

@Component({
  selector: 'app-convocatoria-detalle',
  imports: [RouterLink],
  template: `
  <div class="min-h-screen bg-surface">
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-outline-variant">
      <div class="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
        <a [routerLink]="auth.esPostulante() ? '/portal' : '/'" class="flex items-center gap-3">
          <img src="logo-funproeib.png" alt="Funproeib Andes" class="h-12 w-auto object-contain" />
          <span class="hidden sm:block font-extrabold text-primary-dark">FUNPROEIB ANDES</span>
        </a>
        <a [routerLink]="auth.esPostulante() ? '/portal' : '/'" class="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span> Volver
        </a>
      </div>
    </header>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <div class="max-w-4xl mx-auto px-6 py-10">
      @if (cargando()) {
        <p class="text-center text-on-surface-variant py-16">Cargando convocatoria...</p>
      } @else if (noEncontrado()) {
        <div class="text-center py-16 text-on-surface-variant bg-white rounded-xl border border-outline-variant">
          <span class="material-symbols-outlined text-5xl text-outline-variant">search_off</span>
          <p class="mt-3 font-semibold">No se encontró esta convocatoria.</p>
          <a routerLink="/" class="mt-4 inline-block text-primary font-semibold hover:underline">Volver al inicio</a>
        </div>
      } @else if (programa(); as p) {
        <div class="bg-white rounded-2xl shadow-card border border-outline-variant overflow-hidden">
          <div class="h-2 bg-gradient-to-r from-primary to-secondary"></div>
          <div class="p-8">
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center gap-1 text-xs font-bold uppercase text-secondary">
                <span class="material-symbols-outlined text-[16px]">{{ iconoTipo(p.tipo) }}</span> {{ p.tipo }}
              </span>
              @if (p.edicion) { <span class="text-xs text-on-surface-variant">· Edición {{ p.edicion }}</span> }
              <span class="ml-auto px-3 py-1 rounded-full text-xs font-bold" [class]="badge(p.estado)">{{ p.estado }}</span>
            </div>
            <h1 class="text-3xl font-extrabold text-primary-dark leading-tight">{{ p.nombre }}</h1>

            <div class="mt-5 flex flex-wrap gap-6 text-sm text-on-surface-variant">
              <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">event</span>{{ p.fechaInicio }} → {{ p.fechaFin }}</p>
              <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">groups</span>{{ p.cuposDisponibles }} cupos disponibles</p>
            </div>

            @if (p.descripcion) {
              <section class="mt-8">
                <h2 class="font-bold text-primary-dark text-lg mb-2">Descripción</h2>
                <p class="text-on-surface-variant leading-relaxed whitespace-pre-line">{{ p.descripcion }}</p>
              </section>
            }

            @if (p.modulos.length > 0) {
              <section class="mt-8">
                <h2 class="font-bold text-primary-dark text-lg mb-3">Módulos</h2>
                <ul class="space-y-2">
                  @for (m of p.modulos; track $index) {
                    <li class="flex items-start gap-2 text-on-surface-variant">
                      <span class="material-symbols-outlined text-[18px] text-primary mt-0.5">menu_book</span>
                      <span>{{ m }}</span>
                    </li>
                  }
                </ul>
              </section>
            }

            @if (p.requisitosGenerales.length > 0) {
              <section class="mt-8">
                <h2 class="font-bold text-primary-dark text-lg mb-3">Requisitos generales</h2>
                <ul class="space-y-2">
                  @for (r of p.requisitosGenerales; track $index) {
                    <li class="flex items-start gap-2 text-on-surface-variant">
                      <span class="material-symbols-outlined text-[18px] text-secondary mt-0.5">check_circle</span>
                      <span>{{ r }}</span>
                    </li>
                  }
                </ul>
              </section>
            }

            <div class="mt-10 pt-6 border-t border-outline-variant">
              @if (!auth.estaAutenticado()) {
                <div class="flex flex-wrap items-center gap-4">
                  <a routerLink="/registro" class="px-7 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-all shadow-card flex items-center gap-2">
                    <span class="material-symbols-outlined">how_to_reg</span> Quiero postularme
                  </a>
                  <a routerLink="/login" class="text-sm font-semibold text-primary hover:underline">¿Ya tienes cuenta? Inicia sesión</a>
                </div>
              } @else if (auth.esPostulante()) {
                @if (p.estado === 'ABIERTO') {
                  <button (click)="postular()" [disabled]="enviando()"
                    class="px-7 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-all shadow-card flex items-center gap-2 disabled:opacity-50">
                    <span class="material-symbols-outlined">send</span> {{ enviando() ? 'Enviando...' : 'Postularme a este programa' }}
                  </button>
                } @else {
                  <p class="text-on-surface-variant text-sm">Esta convocatoria no está abierta actualmente para postulaciones.</p>
                }
              } @else {
                <p class="text-on-surface-variant text-sm">
                  Estás viendo esta convocatoria como {{ auth.usuario()?.rol }}.
                  <a routerLink="/admin/programas" class="text-primary font-semibold hover:underline">Gestiónala desde el panel administrativo.</a>
                </p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  </div>
  `,
})
export class ConvocatoriaDetalleComponent implements OnInit {
  programa = signal<ProgramaResponse | null>(null);
  cargando = signal(true);
  noEncontrado = signal(false);
  enviando = signal(false);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private programaService: ProgramaService,
    private postulacionService: PostulacionService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.programaService.obtenerPorId(id).subscribe({
      next: (p) => { this.programa.set(p); this.cargando.set(false); },
      error: () => { this.noEncontrado.set(true); this.cargando.set(false); },
    });
  }

  postular(): void {
    const p = this.programa();
    const idUsuario = this.auth.usuario()?.id;
    if (!p || !idUsuario) return;
    this.enviando.set(true);
    this.postulacionService.crear({ idUsuario, idPrograma: p.id }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.notificar('¡Postulación creada! Ve a "Mis postulaciones" para subir tus documentos.', false);
        setTimeout(() => this.router.navigate(['/portal/mis-postulaciones']), 1500);
      },
      error: (err) => { this.enviando.set(false); this.notificar(err.error?.mensaje || 'No se pudo postular', true); },
    });
  }

  iconoTipo(tipo: string): string {
    const map: Record<string, string> = { DIPLOMADO: 'school', CURSO: 'menu_book', TALLER: 'construction' };
    return map[tipo] ?? 'school';
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
    setTimeout(() => this.mensaje.set(null), error ? 10000 : 5000);
  }
}
