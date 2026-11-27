import { of, throwError } from 'rxjs';
import { UsuariosAdminComponent } from './usuarios-admin';
import { UsuarioResponse } from '../../core/models/usuario.model';

function usuarioFake(overrides: Partial<UsuarioResponse> = {}): UsuarioResponse {
  return {
    id: 1, nombre: 'Ana', apellidoPaterno: 'Quispe', nombreCompleto: 'Ana Quispe',
    correo: 'ana@correo.com', ci: '1234567', rol: 'POSTULANTE',
    fechaRegistro: '2026-01-01', activo: true, emailVerificado: true,
    genero: 'FEMENINO', fechaNacimiento: '1990-01-01', edad: 36,
    nivelEducativo: 'LICENCIATURA',
    ...overrides,
  };
}

describe('UsuariosAdminComponent', () => {
  let component: UsuariosAdminComponent;
  let usuarioServiceFake: any;
  let authFake: any;
  let confirmDialogFake: any;
  const listaInicial = [
    usuarioFake({ id: 1, nombre: 'Ana', nombreCompleto: 'Ana Quispe', correo: 'ana@correo.com', ci: '1111', rol: 'POSTULANTE' }),
    usuarioFake({ id: 2, nombre: 'Beto', nombreCompleto: 'Beto Mamani', correo: 'beto@correo.com', ci: '2222', rol: 'EVALUADOR' }),
    usuarioFake({ id: 3, nombre: 'Carla', nombreCompleto: 'Carla Funproeib', correo: 'admin@funproeib.org', ci: '3333', rol: 'ADMIN' }),
  ];

  beforeEach(() => {
    usuarioServiceFake = {
      listarTodos: vi.fn(() => of(listaInicial)),
      cambiarRol: vi.fn(),
      cambiarActivo: vi.fn(),
      eliminar: vi.fn(),
    };
    authFake = { usuario: () => usuarioFake({ id: 3 }) };
    confirmDialogFake = { confirmar: vi.fn() };
    component = new UsuariosAdminComponent(usuarioServiceFake, authFake, confirmDialogFake);
    component.ngOnInit();
  });

  it('carga la lista de usuarios al iniciar', () => {
    expect(usuarioServiceFake.listarTodos).toHaveBeenCalled();
    expect(component.usuarios().length).toBe(3);
    expect(component.cargando()).toBe(false);
  });

  it('filtra por texto de búsqueda (nombre, correo o CI)', () => {
    component.busqueda = 'beto';
    expect(component.usuariosFiltrados().map(u => u.id)).toEqual([2]);

    component.busqueda = 'admin@funproeib.org';
    expect(component.usuariosFiltrados().map(u => u.id)).toEqual([3]);

    component.busqueda = '1111';
    expect(component.usuariosFiltrados().map(u => u.id)).toEqual([1]);
  });

  it('filtra por rol', () => {
    component.busqueda = '';
    component.filtroRol = 'EVALUADOR';
    expect(component.usuariosFiltrados().map(u => u.id)).toEqual([2]);
  });

  it('combina búsqueda y filtro de rol', () => {
    component.busqueda = 'ana';
    component.filtroRol = 'ADMIN';
    expect(component.usuariosFiltrados()).toEqual([]);
  });

  it('esUsuarioActual detecta al usuario logueado', () => {
    expect(component.esUsuarioActual(listaInicial[2])).toBe(true);
    expect(component.esUsuarioActual(listaInicial[0])).toBe(false);
  });

  it('cambiarRol no llama al servicio si el rol no cambió', async () => {
    await component.cambiarRol(listaInicial[0], 'POSTULANTE');
    expect(usuarioServiceFake.cambiarRol).not.toHaveBeenCalled();
  });

  it('cambiarRol llama al servicio y actualiza la lista local', async () => {
    confirmDialogFake.confirmar.mockResolvedValue(true);
    const actualizado = usuarioFake({ id: 1, rol: 'EVALUADOR', nombreCompleto: 'Ana Quispe' });
    usuarioServiceFake.cambiarRol.mockReturnValue(of(actualizado));

    await component.cambiarRol(listaInicial[0], 'EVALUADOR');

    expect(usuarioServiceFake.cambiarRol).toHaveBeenCalledWith(1, 'EVALUADOR');
    expect(component.usuarios().find(u => u.id === 1)?.rol).toBe('EVALUADOR');
    expect(component.mensajeError()).toBe(false);
  });

  it('cambiarRol muestra el mensaje de error del backend si falla', async () => {
    confirmDialogFake.confirmar.mockResolvedValue(true);
    usuarioServiceFake.cambiarRol.mockReturnValue(throwError(() => ({ error: { mensaje: 'No se puede dejar al sistema sin administradores' } })));

    await component.cambiarRol(listaInicial[2], 'POSTULANTE');

    expect(component.mensaje()).toBe('No se puede dejar al sistema sin administradores');
    expect(component.mensajeError()).toBe(true);
  });

  it('alternarActivo invierte el estado activo y actualiza la lista', () => {
    const actualizado = usuarioFake({ id: 1, activo: false });
    usuarioServiceFake.cambiarActivo.mockReturnValue(of(actualizado));

    component.alternarActivo(listaInicial[0]);

    expect(usuarioServiceFake.cambiarActivo).toHaveBeenCalledWith(1, false);
    expect(component.usuarios().find(u => u.id === 1)?.activo).toBe(false);
  });

  it('eliminar no hace nada si no se confirma', async () => {
    confirmDialogFake.confirmar.mockResolvedValue(false);

    await component.eliminar(listaInicial[0]);

    expect(usuarioServiceFake.eliminar).not.toHaveBeenCalled();
  });

  it('eliminar quita al usuario de la lista si se confirma', async () => {
    confirmDialogFake.confirmar.mockResolvedValue(true);
    usuarioServiceFake.eliminar.mockReturnValue(of(undefined));

    await component.eliminar(listaInicial[0]);

    expect(usuarioServiceFake.eliminar).toHaveBeenCalledWith(1);
    expect(component.usuarios().find(u => u.id === 1)).toBeUndefined();
  });

  it('eliminar muestra el mensaje de error del backend si falla', async () => {
    confirmDialogFake.confirmar.mockResolvedValue(true);
    usuarioServiceFake.eliminar.mockReturnValue(throwError(() => ({ error: { mensaje: 'No se puede eliminar: este usuario ya registró evaluaciones' } })));

    await component.eliminar(listaInicial[1]);

    expect(component.mensaje()).toBe('No se puede eliminar: este usuario ya registró evaluaciones');
    expect(component.mensajeError()).toBe(true);
    expect(component.usuarios().find(u => u.id === 2)).toBeDefined();
  });
});
