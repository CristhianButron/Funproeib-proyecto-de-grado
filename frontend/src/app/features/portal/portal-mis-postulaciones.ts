import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostulacionService } from '../../core/services/postulacion.service';
import { AuthService } from '../../core/services/auth.service';
import { PostulacionResponse } from '../../core/models/postulacion.model';
import { badgePostulacion } from '../../core/utils/estado-colores';

@Component({
  selector: 'app-portal-mis-postulaciones',
  imports: [RouterLink],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Mis postulaciones</h1>
      <p class="text-on-surface-variant">Elige una postulación para completar sus documentos y preguntas.</p>
    </div>

    @if (cargando()) {
      <p class="text-on-surface-variant py-10 text-center">Cargando...</p>
    } @else if (postulaciones().length === 0) {
      <div class="text-center py-16 text-on-surface-variant bg-white rounded-xl border border-outline-variant">
        <span class="material-symbols-outlined text-5xl text-outline-variant">assignment</span>
        <p class="mt-3">Aún no tienes postulaciones.</p>
      </div>
    } @else {
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (po of postulaciones(); track po.id) {
          <a [routerLink]="['/portal/mis-postulaciones', po.id]"
            class="bg-white rounded-xl shadow-card border border-outline-variant p-5 hover:border-primary hover:shadow-lg transition-all flex flex-col gap-3">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold text-primary leading-tight">{{ po.nombrePrograma }}</h3>
              <span class="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold" [class]="badge(po.estado)">{{ po.estado }}</span>
            </div>
            <p class="text-xs text-on-surface-variant">Postulado el {{ po.fechaPostulacion }}</p>
            <div class="mt-auto pt-2 border-t border-outline-variant flex items-center justify-between text-sm font-semibold text-primary">
              Ver y completar
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </a>
        }
      </div>
    }
  </div>
  `,
})
export class PortalMisPostulacionesComponent implements OnInit {
  postulaciones = signal<PostulacionResponse[]>([]);
  cargando = signal(true);

  constructor(
    private postulacionService: PostulacionService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const idUsuario = this.auth.usuario()?.id;
    if (!idUsuario) { this.cargando.set(false); return; }
    this.postulacionService.listarPorUsuario(idUsuario).subscribe({
      next: (data) => { this.postulaciones.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  badge = badgePostulacion;
}
