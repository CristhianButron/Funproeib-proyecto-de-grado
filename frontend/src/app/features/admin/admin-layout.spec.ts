import { of } from 'rxjs';
import { AdminLayoutComponent } from './admin-layout';
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

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let authFake: any;
  let routerFake: any;
  let usuarioServiceFake: any;

  beforeEach(() => {
    authFake = { usuario: () => usuarioFake(), logout: vi.fn() };
    routerFake = { navigate: vi.fn() };
    usuarioServiceFake = { listarPendientesIdentidad: vi.fn(() => of([])) };
    component = new AdminLayoutComponent(authFake, routerFake, usuarioServiceFake);
  });

  afterEach(() => {
    component.ngOnDestroy();
    vi.useRealTimers();
  });

  it('al iniciar, carga el conteo de cuentas pendientes de identidad', () => {
    usuarioServiceFake.listarPendientesIdentidad.mockReturnValue(of([usuarioFake(), usuarioFake({ id: 2 })]));

    component.ngOnInit();

    expect(usuarioServiceFake.listarPendientesIdentidad).toHaveBeenCalled();
    expect(component.pendientesIdentidad()).toBe(2);
  });

  it('un error al cargar el conteo no rompe el layout', () => {
    usuarioServiceFake.listarPendientesIdentidad.mockReturnValue(
      new (class { subscribe(o: any) { o.error(new Error('falló')); } })() as any
    );

    expect(() => component.ngOnInit()).not.toThrow();
    expect(component.pendientesIdentidad()).toBe(0);
  });

  it('refresca el conteo periódicamente mientras el panel está abierto', () => {
    vi.useFakeTimers();
    let llamada = 0;
    usuarioServiceFake.listarPendientesIdentidad.mockImplementation(() => of(llamada++ === 0 ? [] : [usuarioFake()]));

    component.ngOnInit();
    expect(component.pendientesIdentidad()).toBe(0);

    vi.advanceTimersByTime(30000);
    expect(component.pendientesIdentidad()).toBe(1);
  });

  it('ngOnDestroy detiene el refresco periódico', () => {
    vi.useFakeTimers();
    component.ngOnInit();
    const llamadasAntes = usuarioServiceFake.listarPendientesIdentidad.mock.calls.length;

    component.ngOnDestroy();
    vi.advanceTimersByTime(60000);

    expect(usuarioServiceFake.listarPendientesIdentidad.mock.calls.length).toBe(llamadasAntes);
  });

  it('inicial devuelve la primera letra del nombre del usuario logueado', () => {
    expect(component.inicial()).toBe('A');
  });

  it('salir cierra sesión y navega al inicio', () => {
    component.salir();

    expect(authFake.logout).toHaveBeenCalled();
    expect(routerFake.navigate).toHaveBeenCalledWith(['/']);
  });
});
