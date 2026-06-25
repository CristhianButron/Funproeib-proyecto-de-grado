import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { UsuarioService } from './usuario.service';
import { LoginRequest, UsuarioRegistroRequest, UsuarioResponse } from '../models/usuario.model';

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
    return this.usuarioService.registrar(request).pipe(
      tap((usuario) => this.guardarSesion(usuario))
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
