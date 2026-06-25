import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-portal-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
  <div class="min-h-screen flex flex-col bg-surface">
    <header class="sticky top-0 z-40 bg-white border-b border-outline-variant">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a routerLink="/portal" class="flex items-center gap-3">
          <img src="logo-funproeib.png" alt="Funproeib" class="h-10 w-auto object-contain" />
          <span class="font-extrabold text-primary-dark hidden sm:block">Funproeib Andes</span>
        </a>
        <nav class="flex items-center gap-1">
          <a routerLink="/portal" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="bg-primary-fixed text-primary"
            class="px-4 py-2 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-low transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">school</span>
            <span class="hidden sm:inline">Programas</span>
          </a>
          <a routerLink="/portal/mis-postulaciones" routerLinkActive="bg-primary-fixed text-primary"
            class="px-4 py-2 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-low transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">assignment</span>
            <span class="hidden sm:inline">Mis postulaciones</span>
          </a>
          <div class="ml-3 flex items-center gap-2 pl-3 border-l border-outline-variant">
            <div class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{{ inicial() }}</div>
            <button (click)="salir()" class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-low transition-colors" title="Cerrar sesión">
              <span class="material-symbols-outlined">logout</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
    <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-8"><router-outlet /></main>
  </div>
  `,
})
export class PortalLayoutComponent {
  constructor(public auth: AuthService, private router: Router) {}
  inicial(): string { return this.auth.usuario()?.nombreCompleto?.charAt(0)?.toUpperCase() ?? 'U'; }
  salir(): void { this.auth.logout(); this.router.navigate(['/']); }
}
