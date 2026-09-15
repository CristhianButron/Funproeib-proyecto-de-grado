import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UsuarioService } from '../../core/services/usuario.service';

@Component({
  selector: 'app-verificar-correo',
  imports: [RouterLink],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-surface p-6">
    <div class="w-full max-w-md bg-white rounded-2xl border border-outline-variant shadow-card p-8 text-center">
      <img src="logo-funproeib.png" alt="Funproeib" class="h-16 w-auto mx-auto mb-6" />

      @switch (estado()) {
        @case ('cargando') {
          <span class="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p class="mt-4 text-on-surface-variant">Verificando tu correo...</p>
        }
        @case ('exito') {
          <span class="material-symbols-outlined text-5xl text-secondary">check_circle</span>
          <h1 class="text-xl font-extrabold text-primary-dark mt-4">¡Cuenta verificada!</h1>
          <p class="mt-2 text-on-surface-variant">Ya puedes iniciar sesión con la contraseña temporal que te enviamos por correo.</p>
          <a routerLink="/login" class="inline-block mt-6 px-6 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark transition-colors">
            Ir a iniciar sesión
          </a>
        }
        @case ('error') {
          <span class="material-symbols-outlined text-5xl text-error">error</span>
          <h1 class="text-xl font-extrabold text-primary-dark mt-4">No pudimos verificar tu cuenta</h1>
          <p class="mt-2 text-on-surface-variant">{{ mensajeError() }}</p>
          <a routerLink="/login" class="inline-block mt-6 px-6 py-3 rounded-lg font-semibold text-primary hover:bg-primary-fixed transition-colors">
            Volver a iniciar sesión
          </a>
        }
      }
    </div>
  </div>
  `,
})
export class VerificarCorreoComponent implements OnInit {
  estado = signal<'cargando' | 'exito' | 'error'>('cargando');
  mensajeError = signal('El enlace no es válido o ya expiró. Puedes solicitar uno nuevo desde la pantalla de inicio de sesión.');

  constructor(private route: ActivatedRoute, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado.set('error');
      return;
    }
    this.usuarioService.verificarCorreo(token).subscribe({
      next: () => this.estado.set('exito'),
      error: (err) => {
        if (err.error?.mensaje) this.mensajeError.set(err.error.mensaje);
        this.estado.set('error');
      },
    });
  }
}
