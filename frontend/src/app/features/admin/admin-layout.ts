import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
  <div class="min-h-screen flex bg-surface">
    <!-- Sidebar -->
    <aside class="w-64 fixed left-0 top-0 h-full bg-tertiary flex flex-col py-6 z-40">
      <div class="px-5 mb-8 flex items-center gap-3">
        <img src="logo-funproeib.png" alt="Funproeib" class="h-11 w-11 bg-white rounded-lg p-1 object-contain" />
        <div>
          <p class="text-white font-bold leading-tight">Funproeib Andes</p>
          <p class="text-on-tertiary-container text-xs">Panel Administrativo</p>
        </div>
      </div>

      <nav class="flex-1 px-3 space-y-1">
        @for (item of menu; track item.ruta) {
          <a [routerLink]="item.ruta" routerLinkActive="bg-primary text-white"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-on-tertiary-container hover:bg-tertiary-container hover:text-white transition-colors">
            <span class="material-symbols-outlined">{{ item.icono }}</span>
            <span class="font-medium text-sm">{{ item.label }}</span>
          </a>
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
    <div class="flex-1 ml-64 flex flex-col min-h-screen">
      <header class="h-16 bg-white border-b border-outline-variant flex items-center justify-end px-6 gap-4 sticky top-0 z-30">
        <div class="text-right">
          <p class="font-bold text-sm text-on-surface">{{ auth.usuario()?.nombreCompleto }}</p>
          <p class="text-xs text-on-surface-variant uppercase">Administrador</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
          {{ inicial() }}
        </div>
      </header>
      <main class="flex-1 p-6"><router-outlet /></main>
    </div>
  </div>
  `,
})
export class AdminLayoutComponent {
  menu = [
    { ruta: '/admin', label: 'Dashboard', icono: 'dashboard', exact: true },
    { ruta: '/admin/programas', label: 'Programas', icono: 'school', exact: false },
    { ruta: '/admin/postulantes', label: 'Postulantes', icono: 'group', exact: false },
    { ruta: '/admin/evaluaciones', label: 'Evaluaciones', icono: 'assessment', exact: false },
    { ruta: '/admin/lista-negra', label: 'Lista negra', icono: 'block', exact: false },
  ];

  constructor(public auth: AuthService, private router: Router) {}

  inicial(): string {
    return this.auth.usuario()?.nombreCompleto?.charAt(0)?.toUpperCase() ?? 'A';
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
