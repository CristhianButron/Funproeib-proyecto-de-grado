import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cambiar-password-obligatorio',
  imports: [ReactiveFormsModule],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-surface p-6">
    <div class="w-full max-w-md bg-white rounded-2xl border border-outline-variant shadow-card p-8">
      <img src="logo-funproeib.png" alt="Funproeib" class="h-16 w-auto mx-auto mb-6" />
      <h1 class="text-xl font-extrabold text-primary-dark text-center">Cambia tu contraseña</h1>
      <p class="text-on-surface-variant text-sm text-center mt-2 mb-6">
        Es tu primer ingreso. Por seguridad, define una nueva contraseña antes de continuar.
      </p>

      @if (error()) {
        <div class="mb-5 p-3 rounded-lg bg-error-container text-on-error-container text-sm flex items-center gap-2">
          <span class="material-symbols-outlined text-[20px]">error</span>
          {{ error() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold mb-1">Contraseña temporal (la que recibiste por correo) *</label>
          <input type="password" formControlName="contrasenaActual" class="campo" placeholder="••••••••" />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Nueva contraseña *</label>
          <input type="password" formControlName="contrasenaNueva" class="campo" placeholder="Mínimo 8 caracteres" />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Confirmar nueva contraseña *</label>
          <input type="password" formControlName="confirmarContrasena" class="campo" placeholder="Repite la nueva contraseña" />
        </div>

        <button type="submit" [disabled]="form.invalid || guardando()"
          class="w-full py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined">lock_reset</span>
          {{ guardando() ? 'Guardando...' : 'Cambiar contraseña y continuar' }}
        </button>
      </form>
    </div>
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.6rem .8rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; transition: all .15s; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
  `],
})
export class CambiarPasswordObligatorioComponent {
  form: FormGroup;
  guardando = signal(false);
  error = signal<string | null>(null);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      contrasenaActual: ['', Validators.required],
      contrasenaNueva: ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasena: ['', Validators.required],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    const { contrasenaActual, contrasenaNueva, confirmarContrasena } = this.form.value;
    if (contrasenaNueva !== confirmarContrasena) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    const idUsuario = this.auth.usuario()?.id;
    if (!idUsuario) return;

    this.guardando.set(true);
    this.error.set(null);
    this.auth.cambiarPassword({ idUsuario, contrasenaActual, contrasenaNueva }).subscribe({
      next: () => {
        this.guardando.set(false);
        const rol = this.auth.usuario()?.rol;
        this.router.navigate([rol === 'ADMIN' ? '/admin' : '/portal']);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'No se pudo cambiar la contraseña.');
        this.guardando.set(false);
      },
    });
  }
}
