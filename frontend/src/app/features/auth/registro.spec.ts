import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { RegistroComponent } from './registro';
import { UsuarioResponse } from '../../core/models/usuario.model';

function usuarioFake(): UsuarioResponse {
  return {
    id: 1, nombre: 'Ana', apellidoPaterno: 'Quispe', nombreCompleto: 'Ana Quispe',
    correo: 'ana@correo.com', ci: '1234567', rol: 'POSTULANTE',
    fechaRegistro: '2026-01-01', activo: true,
    genero: 'FEMENINO', fechaNacimiento: '1990-01-01', edad: 36,
    nivelEducativo: 'LICENCIATURA',
  };
}

describe('RegistroComponent (lógica de formulario)', () => {
  let component: RegistroComponent;
  let authFake: any;
  const ubicacionFake = {
    listarPaises: vi.fn(() => of([])),
    listarCiudades: vi.fn(() => of([])),
  };

  function llenarFormularioValido() {
    component.form.patchValue({
      nombre: 'Ana',
      apellidoPaterno: 'Quispe',
      correo: 'ana@correo.com',
      ci: '1234567',
      genero: 'FEMENINO',
      fechaNacimiento: '1990-01-01',
      nivelEducativo: 'SECUNDARIA',
      estadoCivil: 'SOLTERO',
    });
    component.idCiudadSeleccionada.set(10);
    component.idCiudadNacimientoSeleccionada.set(20);
  }

  beforeEach(() => {
    authFake = { registrar: vi.fn(() => of(usuarioFake())) };
    component = new RegistroComponent(new FormBuilder(), authFake, ubicacionFake as any);
  });

  it('nivelRequiereCarrera es falso para SECUNDARIA o vacío, verdadero para el resto', () => {
    component.form.patchValue({ nivelEducativo: '' });
    expect(component.nivelRequiereCarrera()).toBe(false);
    component.form.patchValue({ nivelEducativo: 'SECUNDARIA' });
    expect(component.nivelRequiereCarrera()).toBe(false);
    component.form.patchValue({ nivelEducativo: 'LICENCIATURA' });
    expect(component.nivelRequiereCarrera()).toBe(true);
  });

  it('agregarCarrera recorta espacios, agrega y limpia el input', () => {
    component.nuevaCarrera = '  Licenciatura en Educación  ';
    component.agregarCarrera();
    expect(component.carreras()).toEqual(['Licenciatura en Educación']);
    expect(component.nuevaCarrera).toBe('');
  });

  it('agregarCarrera no agrega valores vacíos ni duplicados', () => {
    component.nuevaCarrera = '   ';
    component.agregarCarrera();
    expect(component.carreras()).toEqual([]);

    component.nuevaCarrera = 'Ingeniería';
    component.agregarCarrera();
    component.nuevaCarrera = 'Ingeniería';
    component.agregarCarrera();
    expect(component.carreras()).toEqual(['Ingeniería']);
  });

  it('quitarCarrera elimina por índice', () => {
    component.carreras.set(['A', 'B', 'C']);
    component.quitarCarrera(1);
    expect(component.carreras()).toEqual(['A', 'C']);
  });

  it('registrar no hace nada si el formulario es inválido', () => {
    component.registrar();
    expect(authFake.registrar).not.toHaveBeenCalled();
  });

  it('registrar exige al menos una carrera cuando el nivel educativo la requiere', () => {
    llenarFormularioValido();
    component.form.patchValue({ nivelEducativo: 'LICENCIATURA' });
    component.registrar();
    expect(authFake.registrar).not.toHaveBeenCalled();
    expect(component.error()).toContain('carrera');
  });

  it('mapea la etnia "NINGUNA" a autoidentificacionEtnica undefined', () => {
    llenarFormularioValido();
    component.etniaSeleccion.setValue('NINGUNA');
    component.registrar();
    expect(authFake.registrar).toHaveBeenCalledWith(expect.objectContaining({ autoidentificacionEtnica: undefined }));
  });

  it('mapea una etnia concreta directamente', () => {
    llenarFormularioValido();
    component.etniaSeleccion.setValue('Quechua');
    component.registrar();
    expect(authFake.registrar).toHaveBeenCalledWith(expect.objectContaining({ autoidentificacionEtnica: 'Quechua' }));
  });

  it('mapea "OTRA" al texto libre recortado', () => {
    llenarFormularioValido();
    component.etniaSeleccion.setValue('OTRA');
    component.etniaOtroTexto.setValue('  Yampara  ');
    component.registrar();
    expect(authFake.registrar).toHaveBeenCalledWith(expect.objectContaining({ autoidentificacionEtnica: 'Yampara' }));
  });

  it('"OTRA" con texto vacío manda autoidentificacionEtnica undefined', () => {
    llenarFormularioValido();
    component.etniaSeleccion.setValue('OTRA');
    component.etniaOtroTexto.setValue('   ');
    component.registrar();
    expect(authFake.registrar).toHaveBeenCalledWith(expect.objectContaining({ autoidentificacionEtnica: undefined }));
  });

  it('registrar exitoso marca registroExitoso y guarda el correo', () => {
    llenarFormularioValido();
    component.registrar();
    expect(component.registroExitoso()).toBe(true);
    expect(component.correoRegistrado()).toBe('ana@correo.com');
    expect(component.cargando()).toBe(false);
  });

  it('registrar con error del backend lo muestra y no marca éxito', () => {
    authFake.registrar.mockReturnValue(throwError(() => ({ error: { mensaje: 'Ya existe un usuario con ese correo' } })));
    llenarFormularioValido();
    component.registrar();
    expect(component.error()).toBe('Ya existe un usuario con ese correo');
    expect(component.registroExitoso()).toBe(false);
    expect(component.cargando()).toBe(false);
  });
});
