import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { rutaInicialPorRol } from '../../core/utils/rol-ruta';
import { PasswordRequisitosComponent } from '../../core/components/password-requisitos.component';

@Component({
  selector: 'app-cambiar-password-obligatorio',
  imports: [ReactiveFormsModule, PasswordRequisitosComponent],
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
          <label class="block text-sm font-semibold mb-1">Nueva contraseña *</label>
          <div class="relative">
            <input [type]="mostrarNueva() ? 'text' : 'password'" formControlName="contrasenaNueva" class="campo campo-password" placeholder="Mínimo 8 caracteres, con mayúscula, número y símbolo" />
            <button type="button" (click)="mostrarNueva.set(!mostrarNueva())" class="toggle-password" [attr.aria-label]="mostrarNueva() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <span class="material-symbols-outlined text-[20px]">{{ mostrarNueva() ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
          <app-password-requisitos [password]="form.get('contrasenaNueva')?.value || ''" />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Confirmar nueva contraseña *</label>
          <div class="relative">
            <input [type]="mostrarConfirmar() ? 'text' : 'password'" formControlName="confirmarContrasena" class="campo campo-password" placeholder="Repite la nueva contraseña" />
            <button type="button" (click)="mostrarConfirmar.set(!mostrarConfirmar())" class="toggle-password" [attr.aria-label]="mostrarConfirmar() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <span class="material-symbols-outlined text-[20px]">{{ mostrarConfirmar() ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
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
    .campo:focus { border-color:#1d4e74; box-shadow:0 0 0 2px rgba(29,78,116,.2); }
    .campo-password { padding-right: 2.75rem; }
    .toggle-password { position:absolute; right:.75rem; top:50%; transform:translateY(-50%); color:#6b7280; }
    .toggle-password:hover { color:#1d4e74; }
  `],
})
export class CambiarPasswordObligatorioComponent {
  form: FormGroup;
  guardando = signal(false);
  error = signal<string | null>(null);
  mostrarNueva = signal(false);
  mostrarConfirmar = signal(false);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      // Sin contraseña actual: la persona la escribió hace unos segundos
      // para entrar a esta misma pantalla (ver AuthService.cambiarPasswordObligatorio).
      contrasenaNueva: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/)]],
      confirmarContrasena: ['', Validators.required],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    const { contrasenaNueva, confirmarContrasena } = this.form.value;
    if (contrasenaNueva !== confirmarContrasena) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    const idUsuario = this.auth.usuario()?.id;
    if (!idUsuario) return;

    this.guardando.set(true);
    this.error.set(null);
    this.auth.cambiarPasswordObligatorio({ idUsuario, contrasenaNueva }).subscribe({
      next: () => {
        this.guardando.set(false);
        const rol = this.auth.usuario()?.rol;
        this.router.navigate([rol ? rutaInicialPorRol(rol) : '/login']);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'No se pudo cambiar la contraseña.');
        this.guardando.set(false);
      },
    });
  }
}
