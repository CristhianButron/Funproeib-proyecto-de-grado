import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { UsuarioResponse } from '../models/usuario.model';

function usuario(rol: 'ADMIN' | 'POSTULANTE'): UsuarioResponse {
  return {
    id: rol === 'ADMIN' ? 1 : 2,
    nombreCompleto: rol === 'ADMIN' ? 'Admin' : 'Postulante',
    correo: 'x@y.com', ci: '123', rol,
    fechaRegistro: '2026-01-01', activo: true,
    genero: 'OTRO', fechaNacimiento: '1990-01-01', edad: 36,
    nivelEducativo: 'LICENCIATURA', paisOrigen: 'Bolivia',
  };
}

describe('AuthService (sesión y roles)', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    const usuarioServiceFake = {
      login: () => of(usuario('ADMIN')),
      registrar: () => of(usuario('POSTULANTE')),
    };
    auth = new AuthService(usuarioServiceFake as any);
  });

  it('inicia sin sesión', () => {
    expect(auth.estaAutenticado()).toBe(false);
    expect(auth.esAdmin()).toBe(false);
  });

  it('login guarda la sesión y detecta rol ADMIN', () => {
    auth.login({ correo: 'x@y.com', contrasena: '123' }).subscribe();
    expect(auth.estaAutenticado()).toBe(true);
    expect(auth.esAdmin()).toBe(true);
    expect(auth.esPostulante()).toBe(false);
  });

  it('registro deja al usuario como POSTULANTE', () => {
    auth.registrar({} as any).subscribe();
    expect(auth.esPostulante()).toBe(true);
    expect(auth.esAdmin()).toBe(false);
  });

  it('logout limpia la sesión', () => {
    auth.login({ correo: 'x@y.com', contrasena: '123' }).subscribe();
    auth.logout();
    expect(auth.estaAutenticado()).toBe(false);
    expect(auth.usuario()).toBeNull();
  });

  it('persiste la sesión en localStorage', () => {
    auth.login({ correo: 'x@y.com', contrasena: '123' }).subscribe();
    const otra = new AuthService({ login: () => of(usuario('ADMIN')), registrar: () => of(usuario('POSTULANTE')) } as any);
    expect(otra.estaAutenticado()).toBe(true);
    expect(otra.esAdmin()).toBe(true);
  });
});
