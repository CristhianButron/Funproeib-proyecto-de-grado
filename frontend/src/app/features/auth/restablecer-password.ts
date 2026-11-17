import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../core/services/usuario.service';

@Component({
  selector: 'app-restablecer-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-surface p-6">
    <div class="w-full max-w-md bg-white rounded-2xl border border-outline-variant shadow-card p-8">
      <img src="logo-funproeib.png" alt="Funproeib" class="h-16 w-auto mx-auto mb-6" />

      @switch (estado()) {
        @case ('sinToken') {
          <div class="text-center">
            <span class="material-symbols-outlined text-5xl text-error">error</span>
            <h1 class="text-xl font-extrabold text-primary-dark mt-4">Enlace no válido</h1>
            <p class="mt-2 text-on-surface-variant">Este enlace no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.</p>
            <a routerLink="/olvide-password" class="inline-block mt-6 px-6 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors">
              Solicitar enlace nuevo
            </a>
          </div>
        }
        @case ('exito') {
          <div class="text-center">
            <span class="material-symbols-outlined text-5xl text-secondary">check_circle</span>
            <h1 class="text-xl font-extrabold text-primary-dark mt-4">¡Contraseña actualizada!</h1>
            <p class="mt-2 text-on-surface-variant">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <a routerLink="/login" class="inline-block mt-6 px-6 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors">
              Ir a iniciar sesión
            </a>
          </div>
        }
        @case ('formulario') {
          <h1 class="text-xl font-extrabold text-primary-dark text-center">Define tu nueva contraseña</h1>
          <p class="text-on-surface-variant text-sm text-center mt-2 mb-6">Elige una contraseña nueva para tu cuenta.</p>

          @if (error()) {
            <div class="mb-5 p-3 rounded-lg bg-error-container text-on-error-container text-sm flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">error</span>
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-4">
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
              {{ guardando() ? 'Guardando...' : 'Restablecer contraseña' }}
            </button>
          </form>
        }
      }
    </div>
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.6rem .8rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; transition: all .15s; }
    .campo:focus { border-color:#1e3a8a; box-shadow:0 0 0 2px rgba(30,58,138,.2); }
  `],
})
export class RestablecerPasswordComponent implements OnInit {
  estado = signal<'sinToken' | 'formulario' | 'exito'>('formulario');
  guardando = signal(false);
  error = signal<string | null>(null);
  form: FormGroup;
  private token = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
  ) {
    this.form = this.fb.group({
      contrasenaNueva: ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasena: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado.set('sinToken');
      return;
    }
    this.token = token;
  }

  guardar(): void {
    if (this.form.invalid) return;
    const { contrasenaNueva, confirmarContrasena } = this.form.value;
    if (contrasenaNueva !== confirmarContrasena) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    this.usuarioService.restablecerPassword({ token: this.token, contrasenaNueva }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.estado.set('exito');
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'No se pudo restablecer la contraseña.');
        this.guardando.set(false);
      },
    });
  }
}
