import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { RolUsuario, UsuarioCrearRequest, UsuarioEditarBasicoRequest, UsuarioResponse } from '../../core/models/usuario.model';

@Component({
  selector: 'app-usuarios-admin',
  imports: [FormsModule, RouterLink],
  template: `
  <div>
    <div class="mb-6 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-3xl font-extrabold text-primary-dark">Gestión de usuarios</h1>
        <p class="text-on-surface-variant">Crea cuentas, edita datos, cambia el rol o activa/desactiva cualquiera.</p>
      </div>
      <button (click)="abrirCrear()" class="px-5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-card">
        <span class="material-symbols-outlined">person_add</span> Crear usuario
      </button>
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
        <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-surface-low">
            <tr>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Usuario</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">CI</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Correo verificado</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Identidad</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Rol</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Estado</th>
              <th class="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase text-right">Acciones</th>
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
                    <a [routerLink]="['/admin/usuarios', u.id]" class="px-2 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary hover:opacity-80 transition-colors flex items-center gap-1 w-fit">
                      <span class="material-symbols-outlined text-[14px]">fingerprint</span> Revisar
                    </a>
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
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button (click)="abrirEditar(u)" class="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-high transition-colors"
                      title="Editar datos" aria-label="Editar datos del usuario">
                      <span class="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button (click)="eliminar(u)" [disabled]="esUsuarioActual(u)"
                      class="p-1.5 rounded-lg text-error hover:bg-error-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Eliminar cuenta" aria-label="Eliminar cuenta">
                      <span class="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="px-6 py-10 text-center text-on-surface-variant">No se encontraron usuarios.</td></tr>
            }
          </tbody>
        </table>
        </div>
      }
    </div>
  </div>

  <!-- Modal crear -->
  @if (modalCrear()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="modalCrear.set(false)">
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden" (click)="$event.stopPropagation()">
        <div class="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <h2 class="font-bold text-lg flex items-center gap-2"><span class="material-symbols-outlined">person_add</span> Crear usuario</h2>
          <button (click)="modalCrear.set(false)" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-xs text-on-surface-variant">
            La cuenta queda activa de inmediato con una contraseña temporal que se le envía por correo; deberá cambiarla en su primer ingreso.
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-semibold mb-1">Nombre *</label>
              <input [(ngModel)]="formCrear.nombre" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Apellido paterno *</label>
              <input [(ngModel)]="formCrear.apellidoPaterno" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Apellido materno</label>
              <input [(ngModel)]="formCrear.apellidoMaterno" class="campo" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-semibold mb-1">Correo *</label>
              <input type="email" [(ngModel)]="formCrear.correo" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">CI *</label>
              <input [(ngModel)]="formCrear.ci" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Extensión</label>
              <input [(ngModel)]="formCrear.ciExtension" class="campo" placeholder="LP, CB..." />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-semibold mb-1">Rol *</label>
              <select [(ngModel)]="formCrear.rol" class="campo">
                <option value="EVALUADOR">Evaluador</option>
                <option value="ADMIN">Administrador</option>
                <option value="POSTULANTE">Postulante</option>
              </select>
            </div>
          </div>
        </div>
        <div class="bg-surface-low px-6 py-4 flex justify-end gap-3">
          <button (click)="modalCrear.set(false)" class="px-5 py-2 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-high transition-colors">Cancelar</button>
          <button (click)="crear()" [disabled]="guardando()" class="px-5 py-2 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
            {{ guardando() ? 'Creando...' : 'Crear usuario' }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- Modal editar -->
  @if (usuarioEditando(); as ue) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="usuarioEditando.set(null)">
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden" (click)="$event.stopPropagation()">
        <div class="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <h2 class="font-bold text-lg flex items-center gap-2"><span class="material-symbols-outlined">edit</span> Editar datos de {{ ue.nombreCompleto }}</h2>
          <button (click)="usuarioEditando.set(null)" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-semibold mb-1">Nombre *</label>
              <input [(ngModel)]="formEditar.nombre" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Apellido paterno *</label>
              <input [(ngModel)]="formEditar.apellidoPaterno" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Apellido materno</label>
              <input [(ngModel)]="formEditar.apellidoMaterno" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">CI *</label>
              <input [(ngModel)]="formEditar.ci" class="campo" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Extensión</label>
              <input [(ngModel)]="formEditar.ciExtension" class="campo" placeholder="LP, CB..." />
            </div>
          </div>
        </div>
        <div class="bg-surface-low px-6 py-4 flex justify-end gap-3">
          <button (click)="usuarioEditando.set(null)" class="px-5 py-2 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-high transition-colors">Cancelar</button>
          <button (click)="guardarEdicion()" [disabled]="guardando()" class="px-5 py-2 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
            {{ guardando() ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    .campo { width:100%; padding:.5rem .7rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; font-size:.875rem; }
    .campo:focus { border-color:#9a4a2e; box-shadow:0 0 0 2px rgba(154,74,46,.2); }
    .campo:disabled { background:#f2f2f5; color:#9ca3af; }
  `],
})
export class UsuariosAdminComponent implements OnInit {
  usuarios = signal<UsuarioResponse[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  modalCrear = signal(false);
  formCrear: UsuarioCrearRequest = this.crearVacio();

  usuarioEditando = signal<UsuarioResponse | null>(null);
  formEditar: UsuarioEditarBasicoRequest = { nombre: '', apellidoPaterno: '', apellidoMaterno: '', ci: '', ciExtension: '' };

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

  constructor(
    private usuarioService: UsuarioService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listarTodos().subscribe({
      next: (d) => { this.usuarios.set(d); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.notificar('No se pudo cargar la lista de usuarios. Intenta de nuevo en unos segundos.', true); },
    });
  }

  esUsuarioActual(u: UsuarioResponse): boolean {
    return u.id === this.auth.usuario()?.id;
  }

  private crearVacio(): UsuarioCrearRequest {
    return { nombre: '', apellidoPaterno: '', apellidoMaterno: '', correo: '', ci: '', ciExtension: '', rol: 'EVALUADOR' };
  }

  abrirCrear(): void {
    this.formCrear = this.crearVacio();
    this.modalCrear.set(true);
  }

  crear(): void {
    if (!this.formCrear.nombre.trim() || !this.formCrear.apellidoPaterno.trim() || !this.formCrear.correo.trim() || !this.formCrear.ci.trim()) {
      this.notificar('Completa los campos obligatorios', true);
      return;
    }
    this.guardando.set(true);
    this.usuarioService.crear(this.formCrear).subscribe({
      next: (creado) => {
        this.guardando.set(false);
        this.modalCrear.set(false);
        this.usuarios.update(l => [creado, ...l]);
        this.notificar(`Cuenta de ${creado.nombreCompleto} creada. Se le envió la contraseña temporal por correo.`, false);
      },
      error: (err) => { this.guardando.set(false); this.notificar(err.error?.mensaje || 'No se pudo crear el usuario', true); },
    });
  }

  abrirEditar(u: UsuarioResponse): void {
    this.formEditar = { nombre: u.nombre, apellidoPaterno: u.apellidoPaterno, apellidoMaterno: u.apellidoMaterno ?? '', ci: u.ci, ciExtension: u.ciExtension ?? '' };
    this.usuarioEditando.set(u);
  }

  guardarEdicion(): void {
    const u = this.usuarioEditando();
    if (!u) return;
    if (!this.formEditar.nombre.trim() || !this.formEditar.apellidoPaterno.trim() || !this.formEditar.ci.trim()) {
      this.notificar('Completa los campos obligatorios', true);
      return;
    }
    this.guardando.set(true);
    this.usuarioService.editarDatosBasicos(u.id, this.formEditar).subscribe({
      next: (actualizado) => {
        this.guardando.set(false);
        this.usuarioEditando.set(null);
        this.usuarios.update(l => l.map(x => x.id === actualizado.id ? actualizado : x));
        this.notificar(`Datos de ${actualizado.nombreCompleto} actualizados`, false);
      },
      error: (err) => { this.guardando.set(false); this.notificar(err.error?.mensaje || 'No se pudo actualizar los datos', true); },
    });
  }

  // A diferencia de activo/inactivo (reversible con un clic), cambiar el rol
  // de alguien a ADMIN le da acceso total al sistema: por eso sí pide
  // confirmación, aunque el <select> en sí no tenga fricción.
  async cambiarRol(u: UsuarioResponse, nuevoRol: RolUsuario): Promise<void> {
    if (nuevoRol === u.rol) return;
    const confirmado = await this.confirmDialog.confirmar({
      titulo: 'Cambiar rol',
      mensaje: `¿Cambiar el rol de ${u.nombreCompleto} de ${u.rol} a ${nuevoRol}?`,
      textoConfirmar: 'Cambiar rol',
      peligroso: nuevoRol === 'ADMIN',
    });
    if (!confirmado) return;

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

  // Distinto de rechazarIdentidad (ahora en la ficha de usuario): esto es una baja administrativa normal
  // (sin correo de aviso), por eso también pide confirmación fuerte. Activo
  // /inactivo sigue siendo la forma de suspender sin perder el historial.
  async eliminar(u: UsuarioResponse): Promise<void> {
    const confirmado = await this.confirmDialog.confirmar({
      titulo: 'Eliminar cuenta',
      mensaje: `¿Eliminar la cuenta de ${u.nombreCompleto}?\n\n` +
        'Esta acción borra PERMANENTEMENTE la cuenta y todas sus postulaciones. No se puede deshacer. ' +
        'Si solo quieres que deje de usar el sistema sin perder su historial, usa el botón Activo/Inactivo en vez de esto.',
      textoConfirmar: 'Eliminar cuenta',
      peligroso: true,
    });
    if (!confirmado) return;

    this.usuarioService.eliminar(u.id).subscribe({
      next: () => {
        this.usuarios.update(l => l.filter(x => x.id !== u.id));
        this.notificar(`Cuenta de ${u.nombreCompleto} eliminada.`, false);
      },
      error: (err) => this.notificar(err.error?.mensaje || 'No se pudo eliminar la cuenta', true),
    });
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje.set(msg); this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 4000);
  }
}
