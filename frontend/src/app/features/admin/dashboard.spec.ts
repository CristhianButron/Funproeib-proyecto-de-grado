import { of } from 'rxjs';
import { AdminDashboardComponent } from './dashboard';
import { ProgramaResponse } from '../../core/models/programa.model';
import { UsuarioResponse } from '../../core/models/usuario.model';

function usuarioFake(overrides: Partial<UsuarioResponse> = {}): UsuarioResponse {
  return {
    id: 1, nombre: 'Ana', apellidoPaterno: 'Quispe', nombreCompleto: 'Ana Quispe',
    correo: 'ana@correo.com', ci: '1234567', rol: 'POSTULANTE',
    fechaRegistro: '2026-01-01', activo: true, emailVerificado: true, identidadVerificada: false,
    genero: 'FEMENINO', fechaNacimiento: '1990-01-01', edad: 36,
    nivelEducativo: 'LICENCIATURA',
    ...overrides,
  };
}

function programaFake(overrides: Partial<ProgramaResponse> = {}): ProgramaResponse {
  return {
    id: 1, nombre: 'Diplomado EIB', tipo: 'DIPLOMADO', fechaInicio: '2026-01-01',
    fechaFin: '2026-06-01', cuposDisponibles: 20, estado: 'ABIERTO',
    ...overrides,
  };
}

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let programaServiceFake: any;
  let usuarioServiceFake: any;

  beforeEach(() => {
    programaServiceFake = { listarTodos: vi.fn(() => of([programaFake()])) };
    usuarioServiceFake = {
      listarTodos: vi.fn(() => of([usuarioFake({ rol: 'POSTULANTE' })])),
      listarPendientesIdentidad: vi.fn(() => of([usuarioFake({ id: 5, identidadVerificada: false })])),
    };
    component = new AdminDashboardComponent(programaServiceFake, usuarioServiceFake);
  });

  it('carga las cuentas pendientes de verificación de identidad al iniciar', () => {
    component.ngOnInit();

    expect(usuarioServiceFake.listarPendientesIdentidad).toHaveBeenCalled();
    expect(component.pendientesIdentidad().map(u => u.id)).toEqual([5]);
  });

  it('si no hay cuentas pendientes, la lista queda vacía', () => {
    usuarioServiceFake.listarPendientesIdentidad.mockReturnValue(of([]));

    component.ngOnInit();

    expect(component.pendientesIdentidad()).toEqual([]);
  });

  it('un error al cargar pendientes de identidad no rompe el resto del dashboard', () => {
    usuarioServiceFake.listarPendientesIdentidad.mockReturnValue(
      new (class { subscribe(o: any) { o.error(new Error('falló')); } })() as any
    );

    expect(() => component.ngOnInit()).not.toThrow();
    expect(component.pendientesIdentidad()).toEqual([]);
  });

  it('calcula los KPIs de programas y postulantes', () => {
    component.ngOnInit();

    expect(component.kpis()).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Postulantes', valor: 1 }),
      expect.objectContaining({ label: 'Programas abiertos', valor: 1 }),
    ]));
    expect(component.cargando()).toBe(false);
  });
});
