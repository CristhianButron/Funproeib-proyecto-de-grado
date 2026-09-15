import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { UsuarioService } from './usuario.service';
import { CambiarPasswordRequest, LoginRequest, UsuarioRegistroRequest, UsuarioResponse } from '../models/usuario.model';

const STORAGE_KEY = 'funproeib_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuarioSignal = signal<UsuarioResponse | null>(this.cargarDeStorage());

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly estaAutenticado = computed(() => this.usuarioSignal() !== null);
  readonly esAdmin = computed(() => this.usuarioSignal()?.rol === 'ADMIN');
  readonly esPostulante = computed(() => this.usuarioSignal()?.rol === 'POSTULANTE');

  constructor(private usuarioService: UsuarioService) {}

  login(request: LoginRequest): Observable<UsuarioResponse> {
    return this.usuarioService.login(request).pipe(
      tap((usuario) => this.guardarSesion(usuario))
    );
  }

  registrar(request: UsuarioRegistroRequest): Observable<UsuarioResponse> {
    // No inicia sesión: la cuenta queda sin verificar hasta que la persona
    // confirme su correo, y el login la rechazará hasta entonces.
    return this.usuarioService.registrar(request);
  }

  cambiarPassword(request: CambiarPasswordRequest): Observable<void> {
    return this.usuarioService.cambiarPassword(request).pipe(
      tap(() => {
        const actual = this.usuarioSignal();
        if (actual) this.guardarSesion({ ...actual, debeCambiarPassword: false });
      })
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.usuarioSignal.set(null);
  }

  private guardarSesion(usuario: UsuarioResponse): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    this.usuarioSignal.set(usuario);
  }

  private cargarDeStorage(): UsuarioResponse | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as UsuarioResponse : null;
  }
}
