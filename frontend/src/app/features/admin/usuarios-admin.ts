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
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Identidad</th>
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
                  @if (u.identidadVerificada) {
                    <span class="px-2 py-1 rounded-full text-xs font-bold bg-secondary-light text-on-secondary-container">Verificada</span>
                  } @else {
                    <button (click)="revisarIdentidad(u)" class="px-2 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary hover:opacity-80 transition-colors flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">fingerprint</span> Revisar
                    </button>
                  }
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
              <tr><td colspan="6" class="px-6 py-10 text-center text-on-surface-variant">No se encontraron usuarios.</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  </div>

  <!-- Revisión de identidad -->
  @if (usuarioRevision(); as u) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="cerrarRevision()">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <h2 class="font-bold text-lg flex items-center gap-2"><span class="material-symbols-outlined">fingerprint</span> Verificación de identidad</h2>
          <button (click)="cerrarRevision()"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-6 overflow-y-auto custom-scrollbar space-y-4">
          <div>
            <p class="font-semibold">{{ u.nombreCompleto }}</p>
            <p class="text-sm text-on-surface-variant">CI: {{ u.ci }}{{ u.ciExtension ? ' ' + u.ciExtension : '' }} · {{ u.correo }}</p>
          </div>
          <p class="text-xs text-on-surface-variant">Compara las fotos con el nombre y CI declarados antes de decidir.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-bold text-on-surface-variant uppercase mb-2">Anverso</p>
              @if (imgAnverso()) {
                <img [src]="imgAnverso()" class="w-full rounded-lg border border-outline-variant" alt="Anverso del carnet" />
              } @else {
                <p class="text-sm text-on-surface-variant">Cargando...</p>
              }
            </div>
            <div>
              <p class="text-xs font-bold text-on-surface-variant uppercase mb-2">Reverso</p>
              @if (imgReverso()) {
                <img [src]="imgReverso()" class="w-full rounded-lg border border-outline-variant" alt="Reverso del carnet" />
              } @else {
                <p class="text-sm text-on-surface-variant">Cargando...</p>
              }
            </div>
          </div>
          <div class="flex flex-wrap gap-2 pt-2 border-t border-outline-variant">
            <button (click)="verificarIdentidad(u)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">check_circle</span> Verificar identidad
            </button>
            <button (click)="rechazarIdentidad(u)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-error text-white hover:opacity-90 transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">block</span> Rechazar y eliminar cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  }
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

  usuarioRevision = signal<UsuarioResponse | null>(null);
  imgAnverso = signal<string | null>(null);
  imgReverso = signal<string | null>(null);

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

  revisarIdentidad(u: UsuarioResponse): void {
    this.usuarioRevision.set(u);
    this.imgAnverso.set(null);
    this.imgReverso.set(null);
    this.usuarioService.obtenerCarnet(u.id, 'anverso').subscribe(blob => this.imgAnverso.set(URL.createObjectURL(blob)));
    this.usuarioService.obtenerCarnet(u.id, 'reverso').subscribe(blob => this.imgReverso.set(URL.createObjectURL(blob)));
  }

  cerrarRevision(): void {
    this.liberarImagenes();
    this.usuarioRevision.set(null);
  }

  verificarIdentidad(u: UsuarioResponse): void {
    this.usuarioService.verificarIdentidad(u.id).subscribe({
      next: (actualizado) => {
        this.usuarios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.cerrarRevision();
        this.notificar(`Identidad de ${actualizado.nombreCompleto} verificada.`, false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo verificar la identidad', true),
    });
  }

  // Elimina la cuenta completa (ver UsuarioServiceImpl en el backend): por
  // eso pide confirmación fuerte y luego quita al usuario de la lista,
  // porque el registro deja de existir.
  rechazarIdentidad(u: UsuarioResponse): void {
    const confirmado = window.confirm(
      `¿Rechazar la identidad de ${u.nombreCompleto}?\n\n` +
      'Esta acción ELIMINA PERMANENTEMENTE su cuenta y todas sus postulaciones, ' +
      'y le envía un correo informando que se detectó un posible intento de falsificación de identidad. No se puede deshacer.'
    );
    if (!confirmado) return;

    this.usuarioService.rechazarIdentidad(u.id).subscribe({
      next: () => {
        this.usuarios.update(l => l.filter(x => x.id !== u.id));
        this.cerrarRevision();
        this.notificar('Cuenta eliminada y correo enviado al postulante.', false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo rechazar la identidad', true),
    });
  }

  private liberarImagenes(): void {
    if (this.imgAnverso()) URL.revokeObjectURL(this.imgAnverso()!);
    if (this.imgReverso()) URL.revokeObjectURL(this.imgReverso()!);
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
