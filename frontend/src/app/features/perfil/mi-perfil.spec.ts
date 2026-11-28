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
  let confirmDialogFake: any;
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
    confirmDialogFake = { confirmar: vi.fn(() => Promise.resolve(true)) };
    component = new MiPerfilComponent(new FormBuilder(), authFake, usuarioServiceFake, ubicacionFake as any, confirmDialogFake);
    component.ngOnInit();
  });

  it('precarga los datos del usuario autenticado en el formulario, sin exponer el CI como editable', () => {
    expect(component.form.get('nombre')?.value).toBe('Ana');
    expect(component.form.get('ci')).toBeNull();
    expect(component.form.get('telefono')?.value).toBe('70011111');
    expect(component.idCiudadSeleccionada()).toBe(10);
    expect(component.idCiudadNacimientoSeleccionada()).toBe(20);
  });

  it('el control teléfono rechaza letras pero acepta un "+" de prefijo', () => {
    component.form.patchValue({ telefono: '+591700AB' });
    expect(component.form.get('telefono')?.valid).toBe(false);
    component.form.patchValue({ telefono: '+59170011111' });
    expect(component.form.get('telefono')?.valid).toBe(true);
  });

  it('soloNumerosConPrefijo limpia los caracteres no numéricos y conserva el "+" inicial', () => {
    const input = { value: '+70-011-111' } as HTMLInputElement;
    component.soloNumerosConPrefijo({ target: input } as unknown as Event);
    expect(component.form.get('telefono')?.value).toBe('+70011111');
  });

  it('agregarCarrera toma la carrera seleccionada del catálogo', () => {
    component.onCarreraChange(component.opcionesCarrera.find(o => o.nombre === 'Ciencias de la Educación')!.id);
    component.agregarCarrera();
    expect(component.carreras()).toEqual(['Ciencias de la Educación']);
  });

  it('guardar exige al menos una carrera cuando el nivel educativo la requiere', async () => {
    component.form.patchValue({ nivelEducativo: 'LICENCIATURA' });
    await component.guardar();
    expect(confirmDialogFake.confirmar).not.toHaveBeenCalled();
    expect(usuarioServiceFake.actualizarPerfil).not.toHaveBeenCalled();
    expect(component.mensaje()).toContain('carrera');
  });

  it('guardar exitoso conserva el CI original, actualiza la sesión y muestra confirmación', async () => {
    await component.guardar();
    expect(confirmDialogFake.confirmar).toHaveBeenCalled();
    expect(usuarioServiceFake.actualizarPerfil).toHaveBeenCalledWith(7, expect.objectContaining({ nombre: 'Ana', ci: '1234567', ciExtension: 'LP' }));
    expect(authFake.actualizarUsuarioEnSesion).toHaveBeenCalledWith(usuarioFake());
    expect(component.mensajeError()).toBe(false);
    expect(component.guardando()).toBe(false);
  });

  it('guardar con error del backend lo muestra y no actualiza la sesión', async () => {
    usuarioServiceFake.actualizarPerfil.mockReturnValue(throwError(() => ({ error: { mensaje: 'Ya existe un usuario con ese CI' } })));
    await component.guardar();
    expect(component.mensaje()).toBe('Ya existe un usuario con ese CI');
    expect(component.mensajeError()).toBe(true);
    expect(authFake.actualizarUsuarioEnSesion).not.toHaveBeenCalled();
  });

  it('cambiarPassword rechaza si la confirmación no coincide', async () => {
    component.formPassword.patchValue({ contrasenaActual: 'actual123', contrasenaNueva: 'Nueva@1234', confirmar: 'Otra@1234' });
    await component.cambiarPassword();
    expect(confirmDialogFake.confirmar).not.toHaveBeenCalled();
    expect(authFake.cambiarPassword).not.toHaveBeenCalled();
    expect(component.mensajePassword()).toContain('no coinciden');
  });

  it('cambiarPassword exitoso limpia el formulario y muestra confirmación', async () => {
    component.formPassword.patchValue({ contrasenaActual: 'actual123', contrasenaNueva: 'Nueva@1234', confirmar: 'Nueva@1234' });
    await component.cambiarPassword();
    expect(authFake.cambiarPassword).toHaveBeenCalledWith({ idUsuario: 7, contrasenaActual: 'actual123', contrasenaNueva: 'Nueva@1234' });
    expect(component.mensajePasswordError()).toBe(false);
    expect(component.formPassword.get('contrasenaActual')?.value).toBeFalsy();
  });

  it('cambiarPassword con error del backend lo muestra', async () => {
    authFake.cambiarPassword.mockReturnValue(throwError(() => ({ error: { mensaje: 'La contraseña actual no es correcta' } })));
    component.formPassword.patchValue({ contrasenaActual: 'mala', contrasenaNueva: 'Nueva@1234', confirmar: 'Nueva@1234' });
    await component.cambiarPassword();
    expect(component.mensajePassword()).toBe('La contraseña actual no es correcta');
    expect(component.mensajePasswordError()).toBe(true);
  });
});
