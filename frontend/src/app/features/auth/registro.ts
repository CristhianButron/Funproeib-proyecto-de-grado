import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
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

      <form [formGroup]="form" (ngSubmit)="registrar()" class="bg-white rounded-2xl border border-outline-variant shadow-card p-8 space-y-6">

        <div>
          <h2 class="text-sm font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-2 mb-4">Datos de acceso</h2>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-sm font-semibold mb-1">Nombre completo *</label>
              <input formControlName="nombreCompleto" class="campo" placeholder="Nombre y apellidos" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Correo electrónico *</label>
              <input type="email" formControlName="correo" class="campo" placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Contraseña *</label>
              <input type="password" formControlName="contrasena" class="campo" placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Cédula de Identidad *</label>
              <input formControlName="ci" class="campo" placeholder="Ej: 1234567" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Teléfono</label>
              <input formControlName="telefono" class="campo" placeholder="Ej: 700xxxxx" />
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
            <div>
              <label class="block text-sm font-semibold mb-1">Autoidentificación étnica</label>
              <input formControlName="autoidentificacionEtnica" class="campo" placeholder="Ej: Quechua, Aymara..." />
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-sm font-bold text-primary uppercase tracking-wide border-b border-outline-variant pb-2 mb-4">Procedencia geográfica</h2>
          <div class="grid sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">País *</label>
              <input formControlName="paisOrigen" class="campo" placeholder="Bolivia" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Departamento</label>
              <input formControlName="departamentoOrigen" class="campo" placeholder="Cochabamba" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Municipio</label>
              <input formControlName="municipioOrigen" class="campo" placeholder="Cercado" />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button type="submit" [disabled]="form.invalid || cargando()"
            class="px-6 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2">
            <span class="material-symbols-outlined">how_to_reg</span>
            {{ cargando() ? 'Registrando...' : 'Crear cuenta y postular' }}
          </button>
          <a routerLink="/login" class="px-6 py-3 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-low transition-colors">
            Ya tengo cuenta
          </a>
        </div>
      </form>

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
  `],
})
export class RegistroComponent {
  form: FormGroup;
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.maxLength(150)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      ci: ['', Validators.required],
      telefono: [''],
      genero: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      nivelEducativo: ['', Validators.required],
      autoidentificacionEtnica: [''],
      paisOrigen: ['Bolivia', Validators.required],
      departamentoOrigen: [''],
      municipioOrigen: [''],
    });
  }

  registrar(): void {
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set(null);
    this.auth.registrar(this.form.value).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/portal']);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'No se pudo completar el registro.');
        this.cargando.set(false);
      },
    });
  }
}
