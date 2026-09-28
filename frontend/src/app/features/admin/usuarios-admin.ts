import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { RolUsuario, UsuarioResponse } from '../../core/models/usuario.model';

@Component({
  selector: 'app-usuarios-admin',
  imports: [FormsModule],
  template: `
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Gestión de usuarios</h1>
      <p class="text-on-surface-variant">Cambia el rol o activa/desactiva cualquier cuenta del sistema.</p>
    </div>

    @if (mensaje()) {
      <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] p-3 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <div class="bg-white rounded-xl shadow-card border border-outline-variant p-4 mb-6 flex flex-wrap items-center gap-3">
      <span class="material-symbols-outlined text-primary">search</span>
      <input [(ngModel)]="busqueda" class="campo max-w-xs" placeholder="Buscar por nombre, correo o CI..." />
      <select [(ngModel)]="filtroRol" class="campo max-w-[200px]">
        <option value="">Todos los roles</option>
        <option value="ADMIN">Administrador</option>
        <option value="EVALUADOR">Evaluador</option>
        <option value="POSTULANTE">Postulante</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-card border border-outline-variant overflow-hidden">
      @if (cargando()) {
        <p class="p-6 text-on-surface-variant">Cargando...</p>
      } @else {
        <table class="w-full text-left">
          <thead class="bg-surface-low">
            <tr>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Usuario</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">CI</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Correo verificado</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Rol</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            @for (u of usuariosFiltrados(); track u.id) {
              <tr class="hover:bg-surface-low transition-colors">
                <td class="px-6 py-4">
                  <p class="font-semibold text-sm text-on-surface">{{ u.nombreCompleto }}{{ esUsuarioActual(u) ? ' (tú)' : '' }}</p>
                  <p class="text-xs text-on-surface-variant">{{ u.correo }}</p>
                </td>
                <td class="px-6 py-4 text-sm">{{ u.ci }}{{ u.ciExtension ? ' ' + u.ciExtension : '' }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded-full text-xs font-bold" [class]="u.emailVerificado ? 'bg-secondary-light text-on-secondary-container' : 'bg-surface-high text-on-surface-variant'">
                    {{ u.emailVerificado ? 'Verificado' : 'Pendiente' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <select class="campo max-w-[180px]" [ngModel]="u.rol" [disabled]="esUsuarioActual(u)"
                    (ngModelChange)="cambiarRol(u, $event)">
                    <option value="ADMIN">Administrador</option>
                    <option value="EVALUADOR">Evaluador</option>
                    <option value="POSTULANTE">Postulante</option>
                  </select>
                </td>
                <td class="px-6 py-4 text-right">
                  <button (click)="alternarActivo(u)" [disabled]="esUsuarioActual(u)"
                    class="px-3 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    [class]="u.activo ? 'bg-secondary-light text-on-secondary-container hover:opacity-80' : 'bg-error-container text-on-error-container hover:opacity-80'">
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-6 py-10 text-center text-on-surface-variant">No se encontraron usuarios.</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
    .campo:disabled { background:#f2f2f5; color:#9ca3af; }
  `],
})
export class UsuariosAdminComponent implements OnInit {
  usuarios = signal<UsuarioResponse[]>([]);
  cargando = signal(true);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  busqueda = '';
  filtroRol: RolUsuario | '' = '';

  usuariosFiltrados(): UsuarioResponse[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.usuarios().filter(u => {
      const coincideTexto = !texto
        || u.nombreCompleto.toLowerCase().includes(texto)
        || u.correo.toLowerCase().includes(texto)
        || u.ci.includes(texto);
      const coincideRol = !this.filtroRol || u.rol === this.filtroRol;
      return coincideTexto && coincideRol;
    });
  }

  constructor(private usuarioService: UsuarioService, private auth: AuthService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listarTodos().subscribe({
      next: (d) => { this.usuarios.set(d); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.notificar('Error al cargar los usuarios. Verifica que el servidor esté corriendo.', true); },
    });
  }

  esUsuarioActual(u: UsuarioResponse): boolean {
    return u.id === this.auth.usuario()?.id;
  }

  cambiarRol(u: UsuarioResponse, nuevoRol: RolUsuario): void {
    if (nuevoRol === u.rol) return;
    this.usuarioService.cambiarRol(u.id, nuevoRol).subscribe({
      next: (actualizado) => {
        this.usuarios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.notificar(`Rol de ${actualizado.nombreCompleto} actualizado a ${nuevoRol}`, false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo cambiar el rol', true),
    });
  }

  alternarActivo(u: UsuarioResponse): void {
    this.usuarioService.cambiarActivo(u.id, !u.activo).subscribe({
      next: (actualizado) => {
        this.usuarios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.notificar(`${actualizado.nombreCompleto} ahora está ${actualizado.activo ? 'activo' : 'inactivo'}`, false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo cambiar el estado', true),
    });
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
