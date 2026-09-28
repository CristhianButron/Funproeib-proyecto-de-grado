import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard, authGuard, postulanteGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { UsuarioResponse } from '../models/usuario.model';

function usuarioFake(rol: 'ADMIN' | 'POSTULANTE', debeCambiarPassword = false): UsuarioResponse {
  return {
    id: 1, nombre: 'Test', apellidoPaterno: 'Usuario', nombreCompleto: 'Test Usuario',
    correo: 'x@y.com', ci: '123', rol, fechaRegistro: '2026-01-01', activo: true,
    debeCambiarPassword, genero: 'OTRO', fechaNacimiento: '1990-01-01', edad: 36,
    nivelEducativo: 'LICENCIATURA',
  };
}

describe('Guards de autenticación', () => {
  let navigate: ReturnType<typeof vi.fn>;

  function configurar(usuario: UsuarioResponse | null) {
    navigate = vi.fn();
    const authFake = {
      estaAutenticado: () => usuario !== null,
      esAdmin: () => usuario?.rol === 'ADMIN',
      esPostulante: () => usuario?.rol === 'POSTULANTE',
      usuario: () => usuario,
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authFake },
        { provide: Router, useValue: { navigate } },
      ],
    });
  }

  it('authGuard deja pasar a cualquier usuario autenticado', () => {
    configurar(usuarioFake('POSTULANTE'));
    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(resultado).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('authGuard redirige a /login si no hay sesión', () => {
    configurar(null);
    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(resultado).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('adminGuard deja pasar a un ADMIN que no necesita cambiar contraseña', () => {
    configurar(usuarioFake('ADMIN'));
    const resultado = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(resultado).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('adminGuard redirige a /login si no es ADMIN', () => {
    configurar(usuarioFake('POSTULANTE'));
    const resultado = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(resultado).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('adminGuard redirige a /cambiar-password si el ADMIN tiene contraseña temporal', () => {
    configurar(usuarioFake('ADMIN', true));
    const resultado = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(resultado).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/cambiar-password']);
  });

  it('postulanteGuard deja pasar a un POSTULANTE que no necesita cambiar contraseña', () => {
    configurar(usuarioFake('POSTULANTE'));
    const resultado = TestBed.runInInjectionContext(() => postulanteGuard({} as any, {} as any));
    expect(resultado).toBe(true);
  });

  it('postulanteGuard redirige a /login si no es POSTULANTE', () => {
    configurar(usuarioFake('ADMIN'));
    const resultado = TestBed.runInInjectionContext(() => postulanteGuard({} as any, {} as any));
    expect(resultado).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('postulanteGuard redirige a /cambiar-password si tiene contraseña temporal', () => {
    configurar(usuarioFake('POSTULANTE', true));
    const resultado = TestBed.runInInjectionContext(() => postulanteGuard({} as any, {} as any));
    expect(resultado).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/cambiar-password']);
  });
});
