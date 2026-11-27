import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-evaluador-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
  <div class="min-h-screen flex bg-surface">
    <!-- Fondo oscuro para cerrar el menú al tocar afuera, solo en móvil/tablet -->
    @if (sidebarAbierto()) {
      <div class="fixed inset-0 bg-black/50 z-30 lg:hidden" (click)="sidebarAbierto.set(false)"></div>
    }

    <!-- Sidebar: oculto fuera de pantalla en móvil, siempre visible desde lg -->
    <aside
      class="w-64 fixed left-0 top-0 h-full bg-tertiary flex flex-col py-6 z-40 transform transition-transform duration-200 lg:translate-x-0"
      [class.translate-x-0]="sidebarAbierto()" [class.-translate-x-full]="!sidebarAbierto()">
      <div class="px-5 mb-8 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <img src="logo-funproeib.png" alt="Funproeib" class="h-11 w-11 bg-white rounded-lg p-1 object-contain shrink-0" />
          <div class="min-w-0">
            <p class="text-white font-bold leading-tight truncate">Funproeib Andes</p>
            <p class="text-on-tertiary-container text-xs truncate">Panel Evaluador</p>
          </div>
        </div>
        <button type="button" (click)="sidebarAbierto.set(false)" aria-label="Cerrar menú"
          class="lg:hidden shrink-0 text-on-tertiary-container hover:text-white">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="flex-1 px-3 space-y-5 overflow-y-auto">
        @for (seccion of secciones; track seccion.titulo) {
          <div>
            <p class="px-4 mb-1 text-[11px] font-bold uppercase tracking-wider text-on-tertiary-container/70">{{ seccion.titulo }}</p>
            <div class="space-y-1">
              @for (item of seccion.items; track item.ruta) {
                <a [routerLink]="item.ruta" routerLinkActive="bg-primary text-white"
                  [routerLinkActiveOptions]="{ exact: item.exact }" (click)="sidebarAbierto.set(false)"
                  class="flex items-center gap-3 px-4 py-3 rounded-xl text-on-tertiary-container hover:bg-tertiary-container hover:text-white transition-colors">
                  <span class="material-symbols-outlined">{{ item.icono }}</span>
                  <span class="font-medium text-sm">{{ item.label }}</span>
                </a>
              }
            </div>
          </div>
        }
      </nav>

      <div class="px-3 pt-4 border-t border-tertiary-container">
        <button (click)="salir()"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-tertiary-container hover:bg-tertiary-container hover:text-white transition-colors">
          <span class="material-symbols-outlined">logout</span>
          <span class="font-medium text-sm">Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- Contenido -->
    <div class="flex-1 lg:ml-64 flex flex-col min-h-screen w-full min-w-0">
      <header class="h-16 bg-white border-b border-outline-variant flex items-center justify-between lg:justify-end px-4 lg:px-6 gap-4 sticky top-0 z-20">
        <button type="button" (click)="sidebarAbierto.set(true)" aria-label="Abrir menú"
          class="lg:hidden text-on-surface-variant hover:text-primary">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="flex items-center gap-4 min-w-0">
          <div class="text-right hidden sm:block min-w-0">
            <p class="font-bold text-sm text-on-surface truncate">{{ auth.usuario()?.nombreCompleto }}</p>
            <p class="text-xs text-on-surface-variant uppercase">Evaluador</p>
          </div>
          <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
            {{ inicial() }}
          </div>
        </div>
      </header>
      <main class="flex-1 p-4 lg:p-6 min-w-0"><router-outlet /></main>
    </div>
  </div>
  `,
})
export class EvaluadorLayoutComponent {
  sidebarAbierto = signal(false);
  secciones = [
    {
      titulo: 'Convocatorias',
      items: [
        { ruta: '/evaluador', label: 'Evaluaciones', icono: 'assessment', exact: true },
        { ruta: '/evaluador/postulantes', label: 'Postulantes', icono: 'group', exact: false },
        { ruta: '/evaluador/beneficiarios', label: 'Beneficiarios', icono: 'workspace_premium', exact: false },
      ],
    },
    {
      titulo: 'Administración',
      items: [
        { ruta: '/evaluador/reportes', label: 'Reportes', icono: 'summarize', exact: false },
      ],
    },
    {
      titulo: 'Cuenta',
      items: [
        { ruta: '/evaluador/perfil', label: 'Mi perfil', icono: 'person', exact: false },
      ],
    },
  ];

  constructor(public auth: AuthService, private router: Router) {}

  inicial(): string {
    return this.auth.usuario()?.nombreCompleto?.charAt(0)?.toUpperCase() ?? 'E';
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
