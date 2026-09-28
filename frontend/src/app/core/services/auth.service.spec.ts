import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { UsuarioResponse } from '../models/usuario.model';

function usuario(rol: 'ADMIN' | 'POSTULANTE', debeCambiarPassword = false): UsuarioResponse {
  return {
    id: rol === 'ADMIN' ? 1 : 2,
    nombre: rol === 'ADMIN' ? 'Admin' : 'Postulante',
    apellidoPaterno: 'Funproeib',
    nombreCompleto: rol === 'ADMIN' ? 'Admin Funproeib' : 'Postulante Funproeib',
    correo: 'x@y.com', ci: '123', rol,
    fechaRegistro: '2026-01-01', activo: true, debeCambiarPassword,
    genero: 'OTRO', fechaNacimiento: '1990-01-01', edad: 36,
    nivelEducativo: 'LICENCIATURA', pais: 'Bolivia', ciudad: 'La Paz',
  };
}

describe('AuthService (sesión y roles)', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    const usuarioServiceFake = {
      login: () => of(usuario('ADMIN')),
      registrar: () => of(usuario('POSTULANTE')),
      cambiarPassword: () => of(undefined),
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

  it('registro no inicia sesión (la cuenta queda pendiente de verificar)', () => {
    auth.registrar({} as any).subscribe();
    expect(auth.estaAutenticado()).toBe(false);
    expect(auth.esPostulante()).toBe(false);
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

  it('cambiarPassword apaga el flag debeCambiarPassword de la sesión activa', () => {
    const authConTemporal = new AuthService({
      login: () => of(usuario('POSTULANTE', true)),
      registrar: () => of(usuario('POSTULANTE')),
      cambiarPassword: () => of(undefined),
    } as any);
    authConTemporal.login({ correo: 'x@y.com', contrasena: 'temporal' }).subscribe();
    expect(authConTemporal.usuario()?.debeCambiarPassword).toBe(true);

    authConTemporal.cambiarPassword({ idUsuario: 2, contrasenaActual: 'temporal', contrasenaNueva: 'nueva12345' }).subscribe();

    expect(authConTemporal.usuario()?.debeCambiarPassword).toBe(false);
  });

  it('cambiarPassword no falla si no hay sesión activa', () => {
    expect(() => auth.cambiarPassword({ idUsuario: 1, contrasenaActual: 'a', contrasenaNueva: 'b' }).subscribe()).not.toThrow();
    expect(auth.usuario()).toBeNull();
  });
});
