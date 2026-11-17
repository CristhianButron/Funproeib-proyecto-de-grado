import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { UsuarioResponse } from '../models/usuario.model';

function usuarioFake(token?: string): UsuarioResponse {
  return {
    id: 1, nombre: 'Test', apellidoPaterno: 'Usuario', nombreCompleto: 'Test Usuario',
    correo: 'x@y.com', ci: '123', rol: 'ADMIN', fechaRegistro: '2026-01-01', activo: true,
    genero: 'OTRO', fechaNacimiento: '1990-01-01', edad: 36, nivelEducativo: 'LICENCIATURA',
    token,
  };
}

describe('authInterceptor', () => {
  function configurar(usuario: UsuarioResponse | null) {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { usuario: () => usuario } }],
    });
  }

  it('agrega el header Authorization cuando hay sesión con token', () => {
    configurar(usuarioFake('abc123'));
    const req = new HttpRequest('GET', '/api/usuarios');
    const next = vi.fn((r) => r as any);

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const reqEnviada = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(reqEnviada.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('no agrega el header si no hay sesión', () => {
    configurar(null);
    const req = new HttpRequest('GET', '/api/usuarios');
    const next = vi.fn((r) => r as any);

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const reqEnviada = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(reqEnviada.headers.has('Authorization')).toBe(false);
  });
});
