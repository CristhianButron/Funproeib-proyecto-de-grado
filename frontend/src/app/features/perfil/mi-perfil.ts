import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { CiudadResponse, PaisResponse } from '../../core/models/ubicacion.model';
import { UsuarioActualizarRequest } from '../../core/models/usuario.model';
import { CARRERAS } from '../../core/constants/carreras';
import { SelectBuscableComponent } from '../../core/components/select-buscable.component';

const OPCIONES_ETNIA = [
  'NINGUNA', 'Quechua', 'Aymara', 'Guaraní', 'Chiquitano', 'Mojeño', 'Guarayo',
  'Yuracaré', 'Chácobo', 'Ayoreo', 'Tacana', 'Movima', 'Itonama', 'Baure',
  'Weenhayek', 'Afroboliviano', 'OTRA',
];

@Component({
  selector: 'app-mi-perfil',
  imports: [ReactiveFormsModule, FormsModule, SelectBuscableComponent],
  template: `
  <div class="max-w-3xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-primary-dark">Mi perfil</h1>
      <p class="text-on-surface-variant">Revisa y corrige tus datos, o cambia tu contraseña.</p>
    </div>

    @if (mensaje()) {
      <div class="mb-5 p-3 rounded-lg text-sm font-semibold flex items-center gap-2" [class]="mensajeError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
        <span class="material-symbols-outlined text-[20px]">{{ mensajeError() ? 'error' : 'check_circle' }}</span>
        {{ mensaje() }}
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="guardar()" class="bg-white rounded-2xl border border-outline-variant shadow-card p-8 space-y-6 mb-8">
      <div>
        <h2 class="text-sm font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-2 mb-4">Datos personales</h2>
        <div class="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm font-semibold mb-1">Nombre(s) *</label>
            <input formControlName="nombre" class="campo" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Apellido paterno *</label>
            <input formControlName="apellidoPaterno" class="campo" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Apellido materno</label>
            <input formControlName="apellidoMaterno" class="campo" />
          </div>
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold mb-1">Correo electrónico</label>
            <input [value]="auth.usuario()?.correo" disabled class="campo" />
            <p class="text-xs text-on-surface-variant mt-1">El correo no se puede cambiar desde aquí.</p>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Teléfono</label>
            <input formControlName="telefono" class="campo" placeholder="Ej: 700xxxxx" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Cédula de Identidad *</label>
            <input formControlName="ci" class="campo" inputmode="numeric" maxlength="20" (input)="soloNumeros($event)" />
            @if (form.get('ci')?.value && form.get('ci')?.invalid) {
              <p class="text-xs text-error mt-1">El CI debe contener solo números.</p>
            }
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Extensión</label>
            <input formControlName="ciExtension" class="campo" />
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-sm font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-2 mb-4">Perfil del postulante</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold mb-1">Género *</label>
            <select formControlName="genero" class="campo">
              <option value="">Seleccione...</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
              <option value="PREFIERO_NO_INDICAR">Prefiero no indicar</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Fecha de nacimiento *</label>
            <input type="date" formControlName="fechaNacimiento" class="campo" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Nivel educativo *</label>
            <select formControlName="nivelEducativo" class="campo">
              <option value="">Seleccione...</option>
              <option value="SECUNDARIA">Secundaria</option>
              <option value="TECNICO_MEDIO">Técnico Medio</option>
              <option value="TECNICO_SUPERIOR">Técnico Superior</option>
              <option value="LICENCIATURA">Licenciatura</option>
              <option value="ESPECIALIZACION">Especialización</option>
              <option value="MAESTRIA">Maestría</option>
              <option value="DOCTORADO">Doctorado</option>
            </select>
          </div>
          <div [class.sm:col-span-2]="etniaSeleccion.value === 'OTRA'">
            <label class="block text-sm font-semibold mb-1">Autoidentificación étnica</label>
            <select [formControl]="etniaSeleccion" class="campo">
              @for (op of opcionesEtnia; track op) { <option [value]="op">{{ op === 'OTRA' ? 'Otra' : op === 'NINGUNA' ? 'Ninguna / Prefiero no indicar' : op }}</option> }
            </select>
            @if (etniaSeleccion.value === 'OTRA') {
              <input [formControl]="etniaOtroTexto" class="campo mt-2" placeholder="Especifica tu autoidentificación étnica" />
            }
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Estado civil *</label>
            <select formControlName="estadoCivil" class="campo">
              <option value="">Seleccione...</option>
              <option value="SOLTERO">Soltero(a)</option>
              <option value="CASADO">Casado(a)</option>
              <option value="DIVORCIADO">Divorciado(a)</option>
              <option value="VIUDO">Viudo(a)</option>
              <option value="UNION_LIBRE">Unión libre</option>
            </select>
          </div>
        </div>

        @if (nivelRequiereCarrera()) {
          <div class="mt-4">
            <label class="block text-sm font-semibold mb-1">Carrera o profesión *</label>
            <div class="flex gap-2">
              <select [(ngModel)]="carreraSeleccion" [ngModelOptions]="{standalone: true}" class="campo">
                <option value="">Seleccione una carrera...</option>
                @for (c of catalogoCarreras; track c) { <option [value]="c">{{ c }}</option> }
              </select>
              <button type="button" (click)="agregarCarrera()"
                class="px-4 rounded-lg bg-primary-fixed text-primary font-semibold hover:opacity-80 transition-colors shrink-0">
                Agregar
              </button>
            </div>
            @if (carreraSeleccion === 'Otra') {
              <input [(ngModel)]="carreraOtroTexto" [ngModelOptions]="{standalone: true}" class="campo mt-2" placeholder="Especifica la carrera o profesión" />
            }
            @if (carreras().length > 0) {
              <ul class="mt-2 space-y-1">
                @for (c of carreras(); track c; let i = $index) {
                  <li class="flex items-center justify-between bg-surface-low rounded-lg px-3 py-1.5 text-sm">
                    <span>{{ c }}</span>
                    <button type="button" (click)="quitarCarrera(i)" class="text-error hover:opacity-70" aria-label="Quitar carrera">
                      <span class="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </li>
                }
              </ul>
            } @else {
              <p class="text-xs text-on-surface-variant mt-1">Agrega al menos una carrera o profesión.</p>
            }
          </div>
        }
      </div>

      <div>
        <h2 class="text-sm font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-2 mb-4">Procedencia geográfica</h2>

        <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">Lugar de nacimiento</h3>
        <div class="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label class="block text-sm font-semibold mb-1">País de nacimiento *</label>
            <app-select-buscable [opciones]="paises()" [valor]="idPaisNacimientoSeleccionado()"
              placeholder="Seleccione un país..." (cambio)="onPaisNacimientoChange($event)" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Ciudad de nacimiento *</label>
            <app-select-buscable [opciones]="ciudadesNacimiento()" [valor]="idCiudadNacimientoSeleccionada()"
              [disabled]="!idPaisNacimientoSeleccionado()"
              [placeholder]="idPaisNacimientoSeleccionado() ? 'Seleccione una ciudad...' : 'Primero elige un país'"
              (cambio)="onCiudadNacimientoChange($event)" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-semibold mb-1">Provincia de nacimiento</label>
            <input formControlName="provinciaNacimiento" class="campo" />
          </div>
        </div>

        <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">Residencia actual</h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold mb-1">País de residencia actual *</label>
            <app-select-buscable [opciones]="paises()" [valor]="idPaisSeleccionado()"
              placeholder="Seleccione un país..." (cambio)="onPaisChange($event)" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Ciudad actual de residencia *</label>
            <app-select-buscable [opciones]="ciudades()" [valor]="idCiudadSeleccionada()"
              [disabled]="!idPaisSeleccionado()"
              [placeholder]="idPaisSeleccionado() ? 'Seleccione una ciudad...' : 'Primero elige un país'"
              (cambio)="onCiudadChange($event)" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-semibold mb-1">Dirección de domicilio</label>
            <input formControlName="direccionDomicilio" class="campo" />
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button type="submit" [disabled]="form.invalid || !idCiudadSeleccionada() || !idCiudadNacimientoSeleccionada() || guardando()"
          class="px-6 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2">
          <span class="material-symbols-outlined">save</span>
          {{ guardando() ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </form>

    <form [formGroup]="formPassword" (ngSubmit)="cambiarPassword()" class="bg-white rounded-2xl border border-outline-variant shadow-card p-8 space-y-4">
      <h2 class="text-sm font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-2 mb-4">Cambiar contraseña</h2>

      @if (mensajePassword()) {
        <div class="p-3 rounded-lg text-sm font-semibold flex items-center gap-2" [class]="mensajePasswordError() ? 'bg-error-container text-on-error-container' : 'bg-secondary-light text-on-secondary-container'">
          <span class="material-symbols-outlined text-[20px]">{{ mensajePasswordError() ? 'error' : 'check_circle' }}</span>
          {{ mensajePassword() }}
        </div>
      }

      <div class="grid sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1">Contraseña actual *</label>
          <div class="relative">
            <input [type]="mostrarActual() ? 'text' : 'password'" formControlName="contrasenaActual" class="campo campo-password" />
            <button type="button" (click)="mostrarActual.set(!mostrarActual())" class="toggle-password" [attr.aria-label]="mostrarActual() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <span class="material-symbols-outlined text-[20px]">{{ mostrarActual() ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Nueva contraseña *</label>
          <div class="relative">
            <input [type]="mostrarNueva() ? 'text' : 'password'" formControlName="contrasenaNueva" class="campo campo-password" placeholder="Mínimo 8 caracteres, con mayúscula, número y símbolo" />
            <button type="button" (click)="mostrarNueva.set(!mostrarNueva())" class="toggle-password" [attr.aria-label]="mostrarNueva() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <span class="material-symbols-outlined text-[20px]">{{ mostrarNueva() ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Confirmar nueva contraseña *</label>
          <div class="relative">
            <input [type]="mostrarConfirmar() ? 'text' : 'password'" formControlName="confirmar" class="campo campo-password" />
            <button type="button" (click)="mostrarConfirmar.set(!mostrarConfirmar())" class="toggle-password" [attr.aria-label]="mostrarConfirmar() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <span class="material-symbols-outlined text-[20px]">{{ mostrarConfirmar() ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </div>
      </div>
      <p class="text-xs text-on-surface-variant">Mínimo 8 caracteres.</p>

      <button type="submit" [disabled]="formPassword.invalid || cambiandoPassword()"
        class="px-6 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2">
        <span class="material-symbols-outlined">lock_reset</span>
        {{ cambiandoPassword() ? 'Cambiando...' : 'Cambiar contraseña' }}
      </button>
    </form>
  </div>
  `,
  styles: [`
    .campo {
      width: 100%;
      padding: 0.6rem 0.8rem;
      border: 1px solid #c5c5d3;
      border-radius: 0.5rem;
      outline: none;
      transition: all .15s;
    }
    .campo:focus { border-color: #9a4a2e; box-shadow: 0 0 0 2px rgba(154,74,46,.2); }
    .campo:disabled { background: #f2f2f5; color: #9ca3af; }
    .campo-password { padding-right: 2.75rem; }
    .toggle-password { position:absolute; right:.75rem; top:50%; transform:translateY(-50%); color:#6b7280; }
    .toggle-password:hover { color:#9a4a2e; }
  `],
})
export class MiPerfilComponent implements OnInit {
  form: FormGroup;
  formPassword: FormGroup;

  guardando = signal(false);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);

  cambiandoPassword = signal(false);
  mensajePassword = signal<string | null>(null);
  mensajePasswordError = signal(false);
  mostrarActual = signal(false);
  mostrarNueva = signal(false);
  mostrarConfirmar = signal(false);

  opcionesEtnia = OPCIONES_ETNIA;
  etniaSeleccion = new FormControl('NINGUNA', { nonNullable: true });
  etniaOtroTexto = new FormControl('', { nonNullable: true });

  catalogoCarreras = CARRERAS;
  carreras = signal<string[]>([]);
  carreraSeleccion = '';
  carreraOtroTexto = '';

  paises = signal<PaisResponse[]>([]);
  ciudades = signal<CiudadResponse[]>([]);
  idPaisSeleccionado = signal<number | null>(null);
  idCiudadSeleccionada = signal<number | null>(null);

  ciudadesNacimiento = signal<CiudadResponse[]>([]);
  idPaisNacimientoSeleccionado = signal<number | null>(null);
  idCiudadNacimientoSeleccionada = signal<number | null>(null);

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    private usuarioService: UsuarioService,
    private ubicacionService: UbicacionService,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(80)]],
      apellidoPaterno: ['', [Validators.required, Validators.maxLength(80)]],
      apellidoMaterno: ['', Validators.maxLength(80)],
      ci: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      ciExtension: [''],
      telefono: [''],
      genero: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      nivelEducativo: ['', Validators.required],
      estadoCivil: ['', Validators.required],
      provinciaNacimiento: [''],
      direccionDomicilio: [''],
    });

    this.formPassword = this.fb.group({
      contrasenaActual: ['', Validators.required],
      contrasenaNueva: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/)]],
      confirmar: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.ubicacionService.listarPaises().subscribe(d => this.paises.set(d));
    this.cargarDatosActuales();
  }

  private cargarDatosActuales(): void {
    const u = this.auth.usuario();
    if (!u) return;

    this.form.patchValue({
      nombre: u.nombre,
      apellidoPaterno: u.apellidoPaterno,
      apellidoMaterno: u.apellidoMaterno ?? '',
      ci: u.ci,
      ciExtension: u.ciExtension ?? '',
      telefono: u.telefono ?? '',
      genero: u.genero,
      fechaNacimiento: u.fechaNacimiento,
      nivelEducativo: u.nivelEducativo,
      estadoCivil: u.estadoCivil ?? '',
      provinciaNacimiento: u.provinciaNacimiento ?? '',
      direccionDomicilio: u.direccionDomicilio ?? '',
    });
    this.carreras.set(u.carreras ?? []);

    if (u.autoidentificacionEtnica && this.opcionesEtnia.includes(u.autoidentificacionEtnica)) {
      this.etniaSeleccion.setValue(u.autoidentificacionEtnica);
    } else if (u.autoidentificacionEtnica) {
      this.etniaSeleccion.setValue('OTRA');
      this.etniaOtroTexto.setValue(u.autoidentificacionEtnica);
    } else {
      this.etniaSeleccion.setValue('NINGUNA');
    }

    if (u.idPais) {
      this.idPaisSeleccionado.set(u.idPais);
      this.ubicacionService.listarCiudades(u.idPais).subscribe(d => {
        this.ciudades.set(d);
        this.idCiudadSeleccionada.set(u.idCiudad ?? null);
      });
    }
    if (u.idPaisNacimiento) {
      this.idPaisNacimientoSeleccionado.set(u.idPaisNacimiento);
      this.ubicacionService.listarCiudades(u.idPaisNacimiento).subscribe(d => {
        this.ciudadesNacimiento.set(d);
        this.idCiudadNacimientoSeleccionada.set(u.idCiudadNacimiento ?? null);
      });
    }
  }

  onPaisChange(idPais: number | null): void {
    this.ciudades.set([]);
    this.idCiudadSeleccionada.set(null);
    this.idPaisSeleccionado.set(idPais);
    if (idPais) {
      this.ubicacionService.listarCiudades(idPais).subscribe(d => this.ciudades.set(d));
    }
  }

  onCiudadChange(idCiudad: number | null): void {
    this.idCiudadSeleccionada.set(idCiudad);
  }

  onPaisNacimientoChange(idPais: number | null): void {
    this.ciudadesNacimiento.set([]);
    this.idCiudadNacimientoSeleccionada.set(null);
    this.idPaisNacimientoSeleccionado.set(idPais);
    if (idPais) {
      this.ubicacionService.listarCiudades(idPais).subscribe(d => this.ciudadesNacimiento.set(d));
    }
  }

  onCiudadNacimientoChange(idCiudad: number | null): void {
    this.idCiudadNacimientoSeleccionada.set(idCiudad);
  }

  nivelRequiereCarrera(): boolean {
    const nivel = this.form.get('nivelEducativo')?.value;
    return !!nivel && nivel !== 'SECUNDARIA';
  }

  agregarCarrera(): void {
    const valor = (this.carreraSeleccion === 'Otra' ? this.carreraOtroTexto : this.carreraSeleccion).trim();
    if (!valor || this.carreras().includes(valor)) return;
    this.carreras.update(l => [...l, valor]);
    this.carreraSeleccion = '';
    this.carreraOtroTexto = '';
  }

  quitarCarrera(index: number): void {
    this.carreras.update(l => l.filter((_, i) => i !== index));
  }

  soloNumeros(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '');
    if (limpio !== input.value) {
      this.form.get('ci')?.setValue(limpio);
    }
  }

  guardar(): void {
    if (this.form.invalid || !this.idCiudadSeleccionada() || !this.idCiudadNacimientoSeleccionada()) return;
    if (this.nivelRequiereCarrera() && this.carreras().length === 0) {
      this.mensaje.set('Agrega al menos una carrera o profesión.');
      this.mensajeError.set(true);
      return;
    }
    const usuarioActual = this.auth.usuario();
    if (!usuarioActual) return;

    this.guardando.set(true);
    this.mensaje.set(null);

    let autoidentificacionEtnica: string | undefined;
    if (this.etniaSeleccion.value === 'OTRA') {
      autoidentificacionEtnica = this.etniaOtroTexto.value.trim() || undefined;
    } else if (this.etniaSeleccion.value !== 'NINGUNA') {
      autoidentificacionEtnica = this.etniaSeleccion.value;
    }

    const request: UsuarioActualizarRequest = {
      ...this.form.value,
      idCiudad: this.idCiudadSeleccionada(),
      idCiudadNacimiento: this.idCiudadNacimientoSeleccionada(),
      carreras: this.carreras(),
      autoidentificacionEtnica,
    };

    this.usuarioService.actualizarPerfil(usuarioActual.id, request).subscribe({
      next: (actualizado) => {
        this.auth.actualizarUsuarioEnSesion(actualizado);
        this.guardando.set(false);
        this.mensaje.set('Tus datos se guardaron correctamente.');
        this.mensajeError.set(false);
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensaje.set(err.error?.mensaje || 'No se pudieron guardar los cambios.');
        this.mensajeError.set(true);
      },
    });
  }

  cambiarPassword(): void {
    if (this.formPassword.invalid) return;
    const { contrasenaActual, contrasenaNueva, confirmar } = this.formPassword.value;
    if (contrasenaNueva !== confirmar) {
      this.mensajePassword.set('Las contraseñas nuevas no coinciden.');
      this.mensajePasswordError.set(true);
      return;
    }
    const usuarioActual = this.auth.usuario();
    if (!usuarioActual) return;

    this.cambiandoPassword.set(true);
    this.mensajePassword.set(null);

    this.auth.cambiarPassword({ idUsuario: usuarioActual.id, contrasenaActual, contrasenaNueva }).subscribe({
      next: () => {
        this.cambiandoPassword.set(false);
        this.mensajePassword.set('Contraseña actualizada correctamente.');
        this.mensajePasswordError.set(false);
        this.formPassword.reset();
      },
      error: (err) => {
        this.cambiandoPassword.set(false);
        this.mensajePassword.set(err.error?.mensaje || 'No se pudo cambiar la contraseña.');
        this.mensajePasswordError.set(true);
      },
    });
  }
}
