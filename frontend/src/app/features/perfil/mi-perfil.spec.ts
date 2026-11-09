import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { MiPerfilComponent } from './mi-perfil';
import { UsuarioResponse } from '../../core/models/usuario.model';

function usuarioFake(): UsuarioResponse {
  return {
    id: 7, nombre: 'Ana', apellidoPaterno: 'Quispe', nombreCompleto: 'Ana Quispe',
    correo: 'ana@correo.com', ci: '1234567', ciExtension: 'LP', rol: 'POSTULANTE',
    fechaRegistro: '2026-01-01', activo: true, emailVerificado: true,
    genero: 'FEMENINO', fechaNacimiento: '1990-01-01', edad: 36,
    nivelEducativo: 'SECUNDARIA', estadoCivil: 'SOLTERO', telefono: '70011111',
    idCiudad: 10, idPais: 100, idCiudadNacimiento: 20, idPaisNacimiento: 100,
    provinciaNacimiento: 'Murillo', direccionDomicilio: 'Calle Falsa 123',
    carreras: [],
  };
}

describe('MiPerfilComponent (lógica de formulario)', () => {
  let component: MiPerfilComponent;
  let authFake: any;
  let usuarioServiceFake: any;
  const ubicacionFake = {
    listarPaises: vi.fn(() => of([])),
    listarCiudades: vi.fn(() => of([])),
  };

  beforeEach(() => {
    authFake = {
      usuario: vi.fn(() => usuarioFake()),
      actualizarUsuarioEnSesion: vi.fn(),
      cambiarPassword: vi.fn(() => of(undefined)),
    };
    usuarioServiceFake = { actualizarPerfil: vi.fn(() => of(usuarioFake())) };
    component = new MiPerfilComponent(new FormBuilder(), authFake, usuarioServiceFake, ubicacionFake as any);
    component.ngOnInit();
  });

  it('precarga los datos del usuario autenticado en el formulario', () => {
    expect(component.form.get('nombre')?.value).toBe('Ana');
    expect(component.form.get('ci')?.value).toBe('1234567');
    expect(component.form.get('telefono')?.value).toBe('70011111');
    expect(component.idCiudadSeleccionada()).toBe(10);
    expect(component.idCiudadNacimientoSeleccionada()).toBe(20);
  });

  it('el control ci rechaza valores con letras', () => {
    component.form.patchValue({ ci: '12AB34' });
    expect(component.form.get('ci')?.valid).toBe(false);
  });

  it('soloNumeros limpia los caracteres no numéricos del control ci', () => {
    const input = { value: '1a2b3c' } as HTMLInputElement;
    component.soloNumeros({ target: input } as unknown as Event);
    expect(component.form.get('ci')?.value).toBe('123');
  });

  it('agregarCarrera toma la carrera seleccionada del catálogo', () => {
    component.carreraSeleccion = 'Ciencias de la Educación';
    component.agregarCarrera();
    expect(component.carreras()).toEqual(['Ciencias de la Educación']);
  });

  it('guardar exige al menos una carrera cuando el nivel educativo la requiere', () => {
    component.form.patchValue({ nivelEducativo: 'LICENCIATURA' });
    component.guardar();
    expect(usuarioServiceFake.actualizarPerfil).not.toHaveBeenCalled();
    expect(component.mensaje()).toContain('carrera');
  });

  it('guardar exitoso actualiza la sesión y muestra confirmación', () => {
    component.guardar();
    expect(usuarioServiceFake.actualizarPerfil).toHaveBeenCalledWith(7, expect.objectContaining({ nombre: 'Ana', ci: '1234567' }));
    expect(authFake.actualizarUsuarioEnSesion).toHaveBeenCalledWith(usuarioFake());
    expect(component.mensajeError()).toBe(false);
    expect(component.guardando()).toBe(false);
  });

  it('guardar con error del backend lo muestra y no actualiza la sesión', () => {
    usuarioServiceFake.actualizarPerfil.mockReturnValue(throwError(() => ({ error: { mensaje: 'Ya existe un usuario con ese CI' } })));
    component.guardar();
    expect(component.mensaje()).toBe('Ya existe un usuario con ese CI');
    expect(component.mensajeError()).toBe(true);
    expect(authFake.actualizarUsuarioEnSesion).not.toHaveBeenCalled();
  });

  it('cambiarPassword rechaza si la confirmación no coincide', () => {
    component.formPassword.patchValue({ contrasenaActual: 'actual123', contrasenaNueva: 'nueva1234', confirmar: 'otra1234' });
    component.cambiarPassword();
    expect(authFake.cambiarPassword).not.toHaveBeenCalled();
    expect(component.mensajePassword()).toContain('no coinciden');
  });

  it('cambiarPassword exitoso limpia el formulario y muestra confirmación', () => {
    component.formPassword.patchValue({ contrasenaActual: 'actual123', contrasenaNueva: 'nueva1234', confirmar: 'nueva1234' });
    component.cambiarPassword();
    expect(authFake.cambiarPassword).toHaveBeenCalledWith({ idUsuario: 7, contrasenaActual: 'actual123', contrasenaNueva: 'nueva1234' });
    expect(component.mensajePasswordError()).toBe(false);
    expect(component.formPassword.get('contrasenaActual')?.value).toBeFalsy();
  });

  it('cambiarPassword con error del backend lo muestra', () => {
    authFake.cambiarPassword.mockReturnValue(throwError(() => ({ error: { mensaje: 'La contraseña actual no es correcta' } })));
    component.formPassword.patchValue({ contrasenaActual: 'mala', contrasenaNueva: 'nueva1234', confirmar: 'nueva1234' });
    component.cambiarPassword();
    expect(component.mensajePassword()).toBe('La contraseña actual no es correcta');
    expect(component.mensajePasswordError()).toBe(true);
  });
});
