import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
  <div class="min-h-screen flex bg-surface">
    <!-- Fondo oscuro para cerrar el menú al tocar afuera, solo en móvil/tablet -->
    @if (sidebarAbierto()) {
      <div class="fixed inset-0 bg-black/50 z-30 lg:hidden" (click)="sidebarAbierto.set(false)"></div>
    }

    <!-- Sidebar: oculto fuera de pantalla en móvil, siempre visible desde lg -->
    <aside
      class="fixed left-0 top-0 h-full bg-tertiary flex flex-col py-6 z-40 transform transition-all duration-200 lg:translate-x-0"
      [class.translate-x-0]="sidebarAbierto()" [class.-translate-x-full]="!sidebarAbierto()"
      [class.w-64]="!colapsado()" [class.w-20]="colapsado()">
      <div class="px-5 mb-8 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <img src="logo-funproeib.png" alt="Funproeib" class="h-11 w-11 bg-white rounded-lg p-1 object-contain shrink-0" />
          @if (!colapsado()) {
            <div class="min-w-0">
              <p class="text-white font-bold leading-tight truncate">FUNPROEIB ANDES</p>
              <p class="text-on-tertiary-container text-xs truncate">Panel Administrativo</p>
            </div>
          }
        </div>
        <button type="button" (click)="sidebarAbierto.set(false)" aria-label="Cerrar menú"
          class="lg:hidden shrink-0 text-on-tertiary-container hover:text-white">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="flex-1 px-3 space-y-5 overflow-y-auto">
        @for (seccion of secciones; track seccion.titulo) {
          <div>
            @if (!colapsado()) {
              <p class="px-4 mb-1 text-[11px] font-bold uppercase tracking-wider text-on-tertiary-container/70">{{ seccion.titulo }}</p>
            }
            <div class="space-y-1">
              @for (item of seccion.items; track item.ruta) {
                <a [routerLink]="item.ruta" routerLinkActive="bg-primary text-white"
                  [routerLinkActiveOptions]="{ exact: item.exact }" (click)="sidebarAbierto.set(false)"
                  [title]="colapsado() ? item.label : ''"
                  class="flex items-center gap-3 px-4 py-3 rounded-xl text-on-tertiary-container hover:bg-tertiary-container hover:text-white transition-colors"
                  [class.justify-center]="colapsado()">
                  <span class="material-symbols-outlined shrink-0">{{ item.icono }}</span>
                  @if (!colapsado()) {
                    <span class="font-medium text-sm flex-1">{{ item.label }}</span>
                    @if (item.ruta === '/admin/usuarios' && pendientesIdentidad() > 0) {
                      <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-error text-white">{{ pendientesIdentidad() }}</span>
                    }
                  } @else if (item.ruta === '/admin/usuarios' && pendientesIdentidad() > 0) {
                    <span class="absolute ml-7 -mt-5 w-2 h-2 rounded-full bg-error"></span>
                  }
                </a>
              }
            </div>
          </div>
        }
      </nav>

      <div class="px-3 pt-4 border-t border-tertiary-container space-y-1">
        <button (click)="alternarColapsado()" [title]="colapsado() ? 'Expandir menú' : 'Colapsar menú'"
          class="hidden lg:flex w-full items-center justify-center py-2.5 rounded-xl text-on-tertiary-container hover:bg-tertiary-container hover:text-white transition-colors">
          <span class="material-symbols-outlined shrink-0">{{ colapsado() ? 'chevron_right' : 'chevron_left' }}</span>
        </button>
        <button (click)="salir()" [title]="colapsado() ? 'Cerrar sesión' : ''"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-tertiary-container hover:bg-tertiary-container hover:text-white transition-colors"
          [class.justify-center]="colapsado()">
          <span class="material-symbols-outlined shrink-0">logout</span>
          @if (!colapsado()) { <span class="font-medium text-sm">Cerrar sesión</span> }
        </button>
      </div>
    </aside>

    <!-- Contenido -->
    <div [class]="'flex-1 flex flex-col min-h-screen w-full min-w-0 transition-all duration-200 ' + (colapsado() ? 'lg:ml-20' : 'lg:ml-64')">
      <header class="h-16 bg-white border-b border-outline-variant flex items-center justify-between lg:justify-end px-4 lg:px-6 gap-4 sticky top-0 z-20">
        <button type="button" (click)="sidebarAbierto.set(true)" aria-label="Abrir menú"
          class="lg:hidden text-on-surface-variant hover:text-primary">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="flex items-center gap-4 min-w-0">
          <div class="text-right hidden sm:block min-w-0">
            <p class="font-bold text-sm text-on-surface truncate">{{ auth.usuario()?.nombreCompleto }}</p>
            <p class="text-xs text-on-surface-variant uppercase">Administrador</p>
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
export class AdminLayoutComponent implements OnInit, OnDestroy {
  secciones = [
    {
      titulo: 'Panel',
      items: [
        { ruta: '/admin', label: 'Dashboard', icono: 'dashboard', exact: true },
      ],
    },
    {
      titulo: 'Convocatorias',
      items: [
        { ruta: '/admin/programas', label: 'Programas', icono: 'school', exact: false },
        { ruta: '/admin/postulantes', label: 'Postulantes', icono: 'group', exact: false },
        { ruta: '/admin/beneficiarios', label: 'Beneficiarios', icono: 'workspace_premium', exact: false },
        { ruta: '/admin/evaluaciones', label: 'Evaluaciones', icono: 'assessment', exact: false },
      ],
    },
    {
      titulo: 'Administración',
      items: [
        { ruta: '/admin/reportes', label: 'Reportes', icono: 'summarize', exact: false },
        { ruta: '/admin/lista-negra', label: 'Lista negra', icono: 'block', exact: false },
        { ruta: '/admin/usuarios', label: 'Usuarios', icono: 'manage_accounts', exact: false },
      ],
    },
    {
      titulo: 'Cuenta',
      items: [
        { ruta: '/admin/perfil', label: 'Mi perfil', icono: 'person', exact: false },
      ],
    },
  ];

  pendientesIdentidad = signal(0);
  sidebarAbierto = signal(false);
  colapsado = signal(this.leerColapsado());
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(public auth: AuthService, private router: Router, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarPendientesIdentidad();
    // No hay notificaciones push: esto aproxima el "aviso" refrescando el
    // contador cada 30s mientras el administrador está en el panel.
    this.intervalId = setInterval(() => this.cargarPendientesIdentidad(), 30000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private cargarPendientesIdentidad(): void {
    this.usuarioService.listarPendientesIdentidad().subscribe({
      next: (d) => this.pendientesIdentidad.set(d.length),
      error: () => {},
    });
  }

  inicial(): string {
    return this.auth.usuario()?.nombreCompleto?.charAt(0)?.toUpperCase() ?? 'A';
  }

  // Es solo una comodidad visual por sesión de navegador, no un dato del
  // usuario: por eso se guarda en localStorage (nunca falla la pantalla si
  // no está disponible) en vez de alguna preferencia en el backend.
  private leerColapsado(): boolean {
    try { return localStorage.getItem('admin.sidebarColapsado') === 'true'; } catch { return false; }
  }

  alternarColapsado(): void {
    const nuevo = !this.colapsado();
    this.colapsado.set(nuevo);
    try { localStorage.setItem('admin.sidebarColapsado', String(nuevo)); } catch { /* ignorado */ }
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
