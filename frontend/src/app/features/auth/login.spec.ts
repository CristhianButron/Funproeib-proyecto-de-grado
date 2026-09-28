import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { LoginComponent } from './login';
import { UsuarioResponse } from '../../core/models/usuario.model';

function usuarioFake(overrides: Partial<UsuarioResponse> = {}): UsuarioResponse {
  return {
    id: 1, nombre: 'Ana', apellidoPaterno: 'Quispe', nombreCompleto: 'Ana Quispe',
    correo: 'ana@correo.com', ci: '123', rol: 'POSTULANTE',
    fechaRegistro: '2026-01-01', activo: true,
    genero: 'FEMENINO', fechaNacimiento: '1990-01-01', edad: 36,
    nivelEducativo: 'LICENCIATURA',
    ...overrides,
  };
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authFake: any;
  let usuarioServiceFake: any;
  let navigate: ReturnType<typeof vi.fn>;

  function crearComponente() {
    navigate = vi.fn();
    component = new LoginComponent(new FormBuilder(), authFake, usuarioServiceFake, { navigate } as any);
    component.form.patchValue({ correo: 'ana@correo.com', contrasena: 'clave1234' });
  }

  beforeEach(() => {
    usuarioServiceFake = { reenviarVerificacion: vi.fn(() => of(undefined)) };
  });

  it('no hace login si el formulario es inválido', () => {
    authFake = { login: vi.fn() };
    crearComponente();
    component.form.patchValue({ correo: '' });
    component.ingresar();
    expect(authFake.login).not.toHaveBeenCalled();
  });

  it('login exitoso de un POSTULANTE navega a /portal', () => {
    authFake = { login: vi.fn(() => of(usuarioFake({ rol: 'POSTULANTE' }))) };
    crearComponente();
    component.ingresar();
    expect(navigate).toHaveBeenCalledWith(['/portal']);
  });

  it('login exitoso de un ADMIN navega a /admin', () => {
    authFake = { login: vi.fn(() => of(usuarioFake({ rol: 'ADMIN' }))) };
    crearComponente();
    component.ingresar();
    expect(navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('login con debeCambiarPassword navega a /cambiar-password en vez del destino normal', () => {
    authFake = { login: vi.fn(() => of(usuarioFake({ rol: 'ADMIN', debeCambiarPassword: true }))) };
    crearComponente();
    component.ingresar();
    expect(navigate).toHaveBeenCalledWith(['/cambiar-password']);
    expect(navigate).not.toHaveBeenCalledWith(['/admin']);
  });

  it('login fallido por correo no verificado muestra el botón de reenviar', () => {
    authFake = { login: vi.fn(() => throwError(() => ({ error: { mensaje: 'Debes verificar tu correo electrónico antes de iniciar sesión.' } }))) };
    crearComponente();
    component.ingresar();
    expect(component.error()).toContain('verificar');
    expect(component.mostrarReenviar()).toBe(true);
  });

  it('login fallido por credenciales incorrectas no muestra el botón de reenviar', () => {
    authFake = { login: vi.fn(() => throwError(() => ({ error: { mensaje: 'Correo o contraseña incorrectos' } }))) };
    crearComponente();
    component.ingresar();
    expect(component.mostrarReenviar()).toBe(false);
  });

  it('reenviarVerificacion llama al servicio con el correo del formulario', () => {
    authFake = { login: vi.fn() };
    crearComponente();
    component.reenviarVerificacion();
    expect(usuarioServiceFake.reenviarVerificacion).toHaveBeenCalledWith({ correo: 'ana@correo.com' });
    expect(component.reenviado()).toBe(true);
    expect(component.reenviando()).toBe(false);
  });

  it('reenviarVerificacion no hace nada si el correo está vacío', () => {
    authFake = { login: vi.fn() };
    crearComponente();
    component.form.patchValue({ correo: '' });
    component.reenviarVerificacion();
    expect(usuarioServiceFake.reenviarVerificacion).not.toHaveBeenCalled();
  });

  it('reenviarVerificacion muestra el error del backend si falla', () => {
    authFake = { login: vi.fn() };
    usuarioServiceFake.reenviarVerificacion = vi.fn(() => throwError(() => ({ error: { mensaje: 'No existe una cuenta con ese correo' } })));
    crearComponente();
    component.reenviarVerificacion();
    expect(component.error()).toBe('No existe una cuenta con ese correo');
    expect(component.reenviando()).toBe(false);
  });
});
