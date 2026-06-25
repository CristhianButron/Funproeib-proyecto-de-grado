import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
  <div class="min-h-screen grid lg:grid-cols-2 bg-surface">
    <!-- Panel izquierdo -->
    <div class="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-primary-dark to-primary text-white p-12">
      <img src="logo-funproeib.png" alt="Funproeib" class="h-40 w-auto bg-white rounded-3xl p-4 shadow-lg" />
      <h2 class="text-3xl font-extrabold mt-8 text-center">Funproeib Andes</h2>
      <p class="text-primary-light mt-3 text-center max-w-sm">
        Sistema de gestión académica y verificación de postulaciones
        en programas de formación.
      </p>
    </div>

    <!-- Formulario -->
    <div class="flex items-center justify-center p-6">
      <div class="w-full max-w-md">
        <div class="lg:hidden flex justify-center mb-6">
          <img src="logo-funproeib.png" alt="Funproeib" class="h-24 w-auto" />
        </div>
        <h1 class="text-3xl font-extrabold text-on-surface">Iniciar sesión</h1>
        <p class="text-on-surface-variant mt-2 mb-8">Ingresa tus credenciales para continuar.</p>

        @if (error()) {
          <div class="mb-5 p-3 rounded-lg bg-error-container text-on-error-container text-sm flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">error</span>
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="ingresar()" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-on-surface mb-1">Correo electrónico</label>
            <input type="email" formControlName="correo"
              class="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-on-surface mb-1">Contraseña</label>
            <input type="password" formControlName="contrasena"
              class="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="••••••••" />
          </div>

          <button type="submit" [disabled]="form.invalid || cargando()"
            class="w-full py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">login</span>
            {{ cargando() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <p class="text-center text-on-surface-variant mt-6 text-sm">
          ¿No tienes cuenta?
          <a routerLink="/registro" class="text-primary font-semibold hover:underline">Regístrate aquí</a>
        </p>
        <p class="text-center mt-4">
          <a routerLink="/" class="text-on-surface-variant text-sm hover:text-primary">← Volver al inicio</a>
        </p>
      </div>
    </div>
  </div>
  `,
})
export class LoginComponent {
  form: FormGroup;
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
    });
  }

  ingresar(): void {
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set(null);
    this.auth.login(this.form.value).subscribe({
      next: (usuario) => {
        this.cargando.set(false);
        this.router.navigate([usuario.rol === 'ADMIN' ? '/admin' : '/portal']);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'No se pudo iniciar sesión.');
        this.cargando.set(false);
      },
    });
  }
}
