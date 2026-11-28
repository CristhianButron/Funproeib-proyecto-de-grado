import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../core/services/usuario.service';

@Component({
  selector: 'app-olvide-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-surface p-6">
    <div class="w-full max-w-md bg-white rounded-2xl border border-outline-variant shadow-card p-8">
      <img src="logo-funproeib.png" alt="Funproeib" class="h-16 w-auto mx-auto mb-6" />

      @if (enviado()) {
        <div class="text-center">
          <span class="material-symbols-outlined text-5xl text-secondary">mark_email_read</span>
          <h1 class="text-xl font-extrabold text-primary-dark mt-4">Revisa tu correo</h1>
          <p class="mt-2 text-on-surface-variant">
            Si <strong>{{ correoEnviado() }}</strong> está registrado, te llegará un enlace para restablecer tu contraseña. El enlace vence en 1 hora.
          </p>
          <a routerLink="/login" class="inline-block mt-6 px-6 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors">
            Volver a iniciar sesión
          </a>
        </div>
      } @else {
        <h1 class="text-xl font-extrabold text-primary-dark text-center">¿Olvidaste tu contraseña?</h1>
        <p class="text-on-surface-variant text-sm text-center mt-2 mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>

        @if (error()) {
          <div class="mb-5 p-3 rounded-lg bg-error-container text-on-error-container text-sm flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">error</span>
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="enviar()" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-1">Correo electrónico</label>
            <input type="email" formControlName="correo" class="campo" placeholder="correo@ejemplo.com" />
          </div>

          <button type="submit" [disabled]="form.invalid || enviando()"
            class="w-full py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">send</span>
            {{ enviando() ? 'Enviando...' : 'Enviar enlace de recuperación' }}
          </button>
        </form>

        <p class="text-center mt-4">
          <a routerLink="/login" class="text-on-surface-variant text-sm hover:text-primary">← Volver a iniciar sesión</a>
        </p>
      }
    </div>
  </div>
  `,
  styles: [`
    .campo { width:100%; padding:.6rem .8rem; border:1px solid #c5c5d3; border-radius:.5rem; outline:none; transition: all .15s; }
    .campo:focus { border-color:#1d4e74; box-shadow:0 0 0 2px rgba(29,78,116,.2); }
  `],
})
export class OlvidePasswordComponent {
  form: FormGroup;
  enviando = signal(false);
  enviado = signal(false);
  correoEnviado = signal('');
  error = signal<string | null>(null);

  constructor(private fb: FormBuilder, private usuarioService: UsuarioService) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
    });
  }

  enviar(): void {
    if (this.form.invalid) return;
    const correo = this.form.value.correo;
    this.enviando.set(true);
    this.error.set(null);
    this.usuarioService.olvidePassword({ correo }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.correoEnviado.set(correo);
        this.enviado.set(true);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'No se pudo enviar el enlace de recuperación.');
        this.enviando.set(false);
      },
    });
  }
}
