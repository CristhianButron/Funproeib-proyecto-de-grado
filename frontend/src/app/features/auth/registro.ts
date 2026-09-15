import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { CiudadResponse, PaisResponse } from '../../core/models/ubicacion.model';
import { UsuarioRegistroRequest } from '../../core/models/usuario.model';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  template: `
  <div class="min-h-screen bg-surface py-10 px-4">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <img src="logo-funproeib.png" alt="Funproeib" class="h-12 w-auto" />
        <div>
          <h1 class="text-2xl font-extrabold text-primary-dark">Registro de Postulante</h1>
          <p class="text-on-surface-variant text-sm">Crea tu cuenta para postular a los programas.</p>
        </div>
      </div>

      @if (error()) {
        <div class="mb-5 p-3 rounded-lg bg-error-container text-on-error-container text-sm flex items-center gap-2">
          <span class="material-symbols-outlined text-[20px]">error</span>
          {{ error() }}
        </div>
      }

      @if (registroExitoso()) {
        <div class="bg-white rounded-2xl border border-outline-variant shadow-card p-10 text-center">
          <span class="material-symbols-outlined text-5xl text-secondary">mark_email_read</span>
          <h2 class="text-xl font-extrabold text-primary-dark mt-4">¡Registro recibido!</h2>
          <p class="text-on-surface-variant mt-2 max-w-md mx-auto">
            Te enviamos un correo a <b>{{ correoRegistrado() }}</b> con un enlace de verificación y una
            contraseña temporal. Verifica tu cuenta y luego inicia sesión; el sistema te pedirá
            cambiar esa contraseña en tu primer ingreso.
          </p>
          <a routerLink="/login" class="inline-block mt-6 px-6 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors">
            Ir a iniciar sesión
          </a>
        </div>
      } @else {

      <form [formGroup]="form" (ngSubmit)="registrar()" class="bg-white rounded-2xl border border-outline-variant shadow-card p-8 space-y-6">

        <div>
          <h2 class="text-sm font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-2 mb-4">Datos de acceso</h2>
          <div class="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Nombre(s) *</label>
              <input formControlName="nombre" class="campo" placeholder="Ej: Juan" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Apellido paterno *</label>
              <input formControlName="apellidoPaterno" class="campo" placeholder="Ej: Mamani" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Apellido materno</label>
              <input formControlName="apellidoMaterno" class="campo" placeholder="Ej: Quispe" />
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Correo electrónico *</label>
              <input type="email" formControlName="correo" class="campo" placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Teléfono</label>
              <input formControlName="telefono" class="campo" placeholder="Ej: 700xxxxx" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Cédula de Identidad *</label>
              <input formControlName="ci" class="campo" placeholder="Ej: 1234567" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Extensión</label>
              <input formControlName="ciExtension" class="campo" placeholder="Ej: LP, CB, SC..." />
            </div>
          </div>
          <p class="text-xs text-on-surface-variant mt-3 flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">info</span>
            Te enviaremos una contraseña temporal por correo para tu primer ingreso; no la elijes aquí.
          </p>
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
                <input [(ngModel)]="nuevaCarrera" [ngModelOptions]="{standalone: true}" (keydown.enter)="$event.preventDefault(); agregarCarrera()"
                  class="campo" placeholder="Ej: Licenciatura en Educación Intercultural" />
                <button type="button" (click)="agregarCarrera()"
                  class="px-4 rounded-lg bg-primary-fixed text-primary font-semibold hover:opacity-80 transition-colors shrink-0">
                  Agregar
                </button>
              </div>
              @if (carreras().length > 0) {
                <ul class="mt-2 space-y-1">
                  @for (c of carreras(); track c; let i = $index) {
                    <li class="flex items-center justify-between bg-surface-low rounded-lg px-3 py-1.5 text-sm">
                      <span>{{ c }}</span>
                      <button type="button" (click)="quitarCarrera(i)" class="text-error hover:opacity-70">
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
              <select class="campo" (change)="onPaisNacimientoChange($event)">
                <option value="">Seleccione un país...</option>
                @for (p of paises(); track p.id) { <option [value]="p.id">{{ p.nombre }}</option> }
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Ciudad de nacimiento *</label>
              <select class="campo" [disabled]="!idPaisNacimientoSeleccionado()" (change)="onCiudadNacimientoChange($event)">
                <option value="">{{ idPaisNacimientoSeleccionado() ? 'Seleccione una ciudad...' : 'Primero elige un país' }}</option>
                @for (c of ciudadesNacimiento(); track c.id) { <option [value]="c.id">{{ c.nombre }}</option> }
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-semibold mb-1">Provincia de nacimiento</label>
              <input formControlName="provinciaNacimiento" class="campo" placeholder="Si la conoces (opcional)" />
            </div>
          </div>

          <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">Residencia actual</h3>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">País de residencia actual *</label>
              <select class="campo" (change)="onPaisChange($event)">
                <option value="">Seleccione un país...</option>
                @for (p of paises(); track p.id) { <option [value]="p.id">{{ p.nombre }}</option> }
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Ciudad actual de residencia *</label>
              <select class="campo" [disabled]="!idPaisSeleccionado()" (change)="onCiudadChange($event)">
                <option value="">{{ idPaisSeleccionado() ? 'Seleccione una ciudad...' : 'Primero elige un país' }}</option>
                @for (c of ciudades(); track c.id) { <option [value]="c.id">{{ c.nombre }}</option> }
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-semibold mb-1">Dirección de domicilio</label>
              <input formControlName="direccionDomicilio" class="campo" placeholder="Si quieres indicarla (opcional)" />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button type="submit" [disabled]="form.invalid || !idCiudadSeleccionada() || !idCiudadNacimientoSeleccionada() || cargando()"
            class="px-6 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2">
            <span class="material-symbols-outlined">how_to_reg</span>
            {{ cargando() ? 'Registrando...' : 'Crear cuenta y postular' }}
          </button>
          <a routerLink="/login" class="px-6 py-3 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-low transition-colors">
            Ya tengo cuenta
          </a>
        </div>
      </form>
      }

      <p class="text-center mt-4">
        <a routerLink="/" class="text-on-surface-variant text-sm hover:text-primary">← Volver al inicio</a>
      </p>
    </div>
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
    .campo:focus { border-color: #1e3a8a; box-shadow: 0 0 0 2px rgba(30,58,138,.2); }
    .campo:disabled { background: #f2f2f5; color: #9ca3af; }
  `],
})
export class RegistroComponent implements OnInit {
  form: FormGroup;
  cargando = signal(false);
  error = signal<string | null>(null);
  registroExitoso = signal(false);
  correoRegistrado = signal('');

  opcionesEtnia = [
    'NINGUNA', 'Quechua', 'Aymara', 'Guaraní', 'Chiquitano', 'Mojeño', 'Guarayo',
    'Yuracaré', 'Chácobo', 'Ayoreo', 'Tacana', 'Movima', 'Itonama', 'Baure',
    'Weenhayek', 'Afroboliviano', 'OTRA',
  ];
  etniaSeleccion = new FormControl('NINGUNA', { nonNullable: true });
  etniaOtroTexto = new FormControl('', { nonNullable: true });

  paises = signal<PaisResponse[]>([]);
  ciudades = signal<CiudadResponse[]>([]);
  idPaisSeleccionado = signal<number | null>(null);
  idCiudadSeleccionada = signal<number | null>(null);

  ciudadesNacimiento = signal<CiudadResponse[]>([]);
  idPaisNacimientoSeleccionado = signal<number | null>(null);
  idCiudadNacimientoSeleccionada = signal<number | null>(null);

  carreras = signal<string[]>([]);
  nuevaCarrera = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private ubicacionService: UbicacionService,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(80)]],
      apellidoPaterno: ['', [Validators.required, Validators.maxLength(80)]],
      apellidoMaterno: ['', Validators.maxLength(80)],
      correo: ['', [Validators.required, Validators.email]],
      ci: ['', Validators.required],
      ciExtension: [''],
      telefono: [''],
      genero: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      nivelEducativo: ['', Validators.required],
      estadoCivil: ['', Validators.required],
      provinciaNacimiento: [''],
      direccionDomicilio: [''],
    });
  }

  ngOnInit(): void {
    this.ubicacionService.listarPaises().subscribe(d => this.paises.set(d));
  }

  onPaisChange(event: Event): void {
    const idPais = (event.target as HTMLSelectElement).value;
    this.ciudades.set([]);
    this.idCiudadSeleccionada.set(null);
    this.idPaisSeleccionado.set(idPais ? +idPais : null);
    if (idPais) {
      this.ubicacionService.listarCiudades(+idPais).subscribe(d => this.ciudades.set(d));
    }
  }

  onCiudadChange(event: Event): void {
    const idCiudad = (event.target as HTMLSelectElement).value;
    this.idCiudadSeleccionada.set(idCiudad ? +idCiudad : null);
  }

  onPaisNacimientoChange(event: Event): void {
    const idPais = (event.target as HTMLSelectElement).value;
    this.ciudadesNacimiento.set([]);
    this.idCiudadNacimientoSeleccionada.set(null);
    this.idPaisNacimientoSeleccionado.set(idPais ? +idPais : null);
    if (idPais) {
      this.ubicacionService.listarCiudades(+idPais).subscribe(d => this.ciudadesNacimiento.set(d));
    }
  }

  onCiudadNacimientoChange(event: Event): void {
    const idCiudad = (event.target as HTMLSelectElement).value;
    this.idCiudadNacimientoSeleccionada.set(idCiudad ? +idCiudad : null);
  }

  nivelRequiereCarrera(): boolean {
    const nivel = this.form.get('nivelEducativo')?.value;
    return !!nivel && nivel !== 'SECUNDARIA';
  }

  agregarCarrera(): void {
    const valor = this.nuevaCarrera.trim();
    if (!valor || this.carreras().includes(valor)) return;
    this.carreras.update(l => [...l, valor]);
    this.nuevaCarrera = '';
  }

  quitarCarrera(index: number): void {
    this.carreras.update(l => l.filter((_, i) => i !== index));
  }

  registrar(): void {
    if (this.form.invalid || !this.idCiudadSeleccionada() || !this.idCiudadNacimientoSeleccionada()) return;
    if (this.nivelRequiereCarrera() && this.carreras().length === 0) {
      this.error.set('Agrega al menos una carrera o profesión.');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    let autoidentificacionEtnica: string | undefined;
    if (this.etniaSeleccion.value === 'OTRA') {
      autoidentificacionEtnica = this.etniaOtroTexto.value.trim() || undefined;
    } else if (this.etniaSeleccion.value !== 'NINGUNA') {
      autoidentificacionEtnica = this.etniaSeleccion.value;
    }

    const request: UsuarioRegistroRequest = {
      ...this.form.value,
      idCiudad: this.idCiudadSeleccionada(),
      idCiudadNacimiento: this.idCiudadNacimientoSeleccionada(),
      carreras: this.carreras(),
      autoidentificacionEtnica,
    };
    this.auth.registrar(request).subscribe({
      next: (usuario) => {
        this.cargando.set(false);
        this.correoRegistrado.set(usuario.correo);
        this.registroExitoso.set(true);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'No se pudo completar el registro.');
        this.cargando.set(false);
      },
    });
  }
}
