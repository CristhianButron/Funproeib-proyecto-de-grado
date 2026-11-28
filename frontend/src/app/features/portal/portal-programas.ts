import { Component, OnInit, Signal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ProgramaResponse } from '../../core/models/programa.model';

@Component({
  selector: 'app-portal-programas',
  imports: [RouterLink],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Programas disponibles</h1>
      <p class="text-on-surface-variant">Hola {{ auth.usuario()?.nombreCompleto }}, postula a las convocatorias abiertas.</p>
    </div>

    @if (cargando()) {
      <p class="text-on-surface-variant py-10 text-center">Cargando...</p>
    } @else if (abiertos().length === 0) {
      <div class="text-center py-16 text-on-surface-variant bg-white rounded-xl border border-outline-variant">
        <span class="material-symbols-outlined text-5xl text-outline-variant">inbox</span>
        <p class="mt-3">No hay convocatorias abiertas en este momento.</p>
      </div>
    } @else {
      <div class="grid md:grid-cols-3 gap-6">
        @for (p of abiertos(); track p.id) {
          <div class="rounded-2xl border border-outline-variant overflow-hidden shadow-card hover:shadow-card-hover transition-shadow bg-white flex flex-col">
            <div class="h-2 bg-gradient-to-r from-primary to-secondary"></div>
            <div class="p-6 flex-1 flex flex-col">
              <span class="text-xs font-bold text-secondary uppercase">{{ p.tipo }}</span>
              <h3 class="font-bold text-on-surface text-lg mt-1">{{ p.nombre }}</h3>
              <div class="mt-4 space-y-2 text-sm text-on-surface-variant flex-1">
                <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">event</span>{{ p.fechaInicio }} → {{ p.fechaFin }}</p>
              </div>
              <div class="mt-5 flex gap-2">
                <a [routerLink]="['/programas', p.id]"
                  class="flex-1 text-center px-4 py-2 rounded-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">info</span> Ver detalles
                </a>
                <button (click)="postular(p)" [disabled]="enviando()"
                  class="flex-1 px-4 py-2 rounded-lg font-semibold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">send</span> Postularme
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  </div>
  `,
})
export class PortalProgramasComponent implements OnInit {
  abiertos = signal<ProgramaResponse[]>([]);
  cargando = signal(true);
  enviando = signal(false);
  readonly mensaje: Signal<string | null>;
  readonly mensajeError: Signal<boolean>;

  constructor(
    private programaService: ProgramaService,
    private postulacionService: PostulacionService,
    public auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {
    this.mensaje = toast.mensaje;
    this.mensajeError = toast.esError;
  }

  ngOnInit(): void {
    this.programaService.listarTodos().subscribe({
      next: (data) => { this.abiertos.set(data.filter(p => p.estado === 'ABIERTO')); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  postular(p: ProgramaResponse): void {
    const idUsuario = this.auth.usuario()?.id;
    if (!idUsuario) return;
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

  private notificar(msg: string, error: boolean): void {
    this.toast.notificar(msg, error, error ? 10000 : 5000);
  }
}
