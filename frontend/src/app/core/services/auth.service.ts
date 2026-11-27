import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { UsuarioService } from './usuario.service';
import { CambiarPasswordObligatorioRequest, CambiarPasswordRequest, LoginRequest, UsuarioRegistroRequest, UsuarioResponse } from '../models/usuario.model';

const STORAGE_KEY = 'funproeib_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuarioSignal = signal<UsuarioResponse | null>(this.cargarDeStorage());

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly estaAutenticado = computed(() => this.usuarioSignal() !== null);
  readonly esAdmin = computed(() => this.usuarioSignal()?.rol === 'ADMIN');
  readonly esEvaluador = computed(() => this.usuarioSignal()?.rol === 'EVALUADOR');
  readonly esPostulante = computed(() => this.usuarioSignal()?.rol === 'POSTULANTE');

  constructor(private usuarioService: UsuarioService) {}

  login(request: LoginRequest): Observable<UsuarioResponse> {
    return this.usuarioService.login(request).pipe(
      tap((usuario) => this.guardarSesion(usuario))
    );
  }

  registrar(request: UsuarioRegistroRequest, carnetAnverso: File, carnetReverso: File): Observable<UsuarioResponse> {
    // No inicia sesión: la cuenta queda sin verificar hasta que la persona
    // confirme su correo Y un administrador verifique su identidad con el
    // carnet, y el login la rechazará hasta entonces.
    return this.usuarioService.registrar(request, carnetAnverso, carnetReverso);
  }

  cambiarPassword(request: CambiarPasswordRequest): Observable<void> {
    return this.usuarioService.cambiarPassword(request).pipe(
      tap(() => {
        const actual = this.usuarioSignal();
        if (actual) this.guardarSesion({ ...actual, debeCambiarPassword: false });
      })
    );
  }

  cambiarPasswordObligatorio(request: CambiarPasswordObligatorioRequest): Observable<void> {
    return this.usuarioService.cambiarPasswordObligatorio(request).pipe(
      tap(() => {
        const actual = this.usuarioSignal();
        if (actual) this.guardarSesion({ ...actual, debeCambiarPassword: false });
      })
    );
  }

  actualizarUsuarioEnSesion(usuario: UsuarioResponse): void {
    this.guardarSesion(usuario);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.usuarioSignal.set(null);
  }

  private guardarSesion(usuario: UsuarioResponse): void {
    // Solo login manda token; en cualquier otra respuesta (editar perfil,
    // etc.) hay que conservar el que ya estaba guardado o se perdería la
    // sesión sin que la persona haya cerrado sesión.
    const token = usuario.token ?? this.usuarioSignal()?.token;
    const aGuardar = { ...usuario, token };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aGuardar));
    this.usuarioSignal.set(aGuardar);
  }

  private cargarDeStorage(): UsuarioResponse | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as UsuarioResponse : null;
  }
}
