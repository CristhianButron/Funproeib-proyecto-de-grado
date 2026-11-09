import { of, throwError } from 'rxjs';
import { ProgramasAdminComponent } from './programas-admin';
import { CriterioEvaluacionResponse } from '../../core/models/evaluacion.model';

function criterio(id: number, orden: number, nombreCriterio: string, activo = true): CriterioEvaluacionResponse {
  return { id, orden, nombreCriterio, descripcion: '', activo };
}

describe('ProgramasAdminComponent - CRUD de criterios de evaluación', () => {
  let component: ProgramasAdminComponent;
  let criterioServiceFake: any;
  const programaServiceFake = { listarTodos: vi.fn(() => of([])) };
  const reqDocServiceFake = {};
  const preguntaServiceFake = {};

  function seisCriterios(): CriterioEvaluacionResponse[] {
    return [1, 2, 3, 4, 5, 6].map(i => criterio(i, i, `Criterio ${i}`));
  }

  beforeEach(() => {
    criterioServiceFake = {
      listarTodos: vi.fn(() => of(seisCriterios())),
      crear: vi.fn(),
      actualizar: vi.fn(),
      cambiarActivo: vi.fn(),
    };
    component = new ProgramasAdminComponent(
      programaServiceFake as any, criterioServiceFake, reqDocServiceFake as any, preguntaServiceFake as any,
    );
    component.ngOnInit();
  });

  it('calcula el valor por criterio como 100/activos', () => {
    expect(component.valorPorCriterio()).toBe('16.67');
  });

  it('con 5 criterios activos (uno inactivo) el valor por criterio es 20.00', () => {
    const datos = seisCriterios();
    datos[5].activo = false;
    criterioServiceFake.listarTodos.mockReturnValue(of(datos));
    component.ngOnInit();
    expect(component.valorPorCriterio()).toBe('20.00');
  });

  it('agregarCriterio rechaza un nombre vacío sin llamar al servicio', () => {
    component.nuevoCriterio = { nombreCriterio: '   ', descripcion: '' };
    component.agregarCriterio();
    expect(criterioServiceFake.crear).not.toHaveBeenCalled();
    expect(component.mensaje()).toContain('nombre');
  });

  it('agregarCriterio exitoso agrega el criterio a la lista y recorta espacios', () => {
    const nuevo = criterio(7, 7, 'Puntualidad');
    criterioServiceFake.crear.mockReturnValue(of(nuevo));
    component.nuevoCriterio = { nombreCriterio: '  Puntualidad  ', descripcion: '' };
    component.agregarCriterio();
    expect(criterioServiceFake.crear).toHaveBeenCalledWith({ nombreCriterio: 'Puntualidad', descripcion: undefined });
    expect(component.criterios()).toHaveLength(7);
    expect(component.nuevoCriterio.nombreCriterio).toBe('');
  });

  it('agregarCriterio con error del backend lo muestra', () => {
    criterioServiceFake.crear.mockReturnValue(throwError(() => ({ error: { mensaje: 'Ya existe un criterio con ese nombre' } })));
    component.nuevoCriterio = { nombreCriterio: 'Repetido', descripcion: '' };
    component.agregarCriterio();
    expect(component.mensaje()).toBe('Ya existe un criterio con ese nombre');
    expect(component.mensajeError()).toBe(true);
  });

  it('iniciarEdicionCriterio precarga el formulario y cancelarEdicionCriterio lo cierra', () => {
    const c = component.criterios()[0];
    component.iniciarEdicionCriterio(c);
    expect(component.editandoCriterioId()).toBe(c.id);
    expect(component.edicionCriterio.nombreCriterio).toBe(c.nombreCriterio);
    component.cancelarEdicionCriterio();
    expect(component.editandoCriterioId()).toBeNull();
  });

  it('guardarEdicionCriterio actualiza el criterio en la lista', () => {
    const c = component.criterios()[0];
    const actualizado = { ...c, nombreCriterio: 'Nuevo nombre' };
    criterioServiceFake.actualizar.mockReturnValue(of(actualizado));
    component.iniciarEdicionCriterio(c);
    component.edicionCriterio.nombreCriterio = 'Nuevo nombre';
    component.guardarEdicionCriterio(c);
    expect(component.criterios().find(x => x.id === c.id)?.nombreCriterio).toBe('Nuevo nombre');
    expect(component.editandoCriterioId()).toBeNull();
  });

  it('desactivarCriterio actualiza el estado activo del criterio en la lista', () => {
    const c = component.criterios()[0];
    const desactivado = { ...c, activo: false };
    criterioServiceFake.cambiarActivo.mockReturnValue(of(desactivado));
    component.desactivarCriterio(c);
    expect(criterioServiceFake.cambiarActivo).toHaveBeenCalledWith(c.id, false);
    expect(component.criterios().find(x => x.id === c.id)?.activo).toBe(false);
  });

  it('desactivarCriterio el último activo muestra el error del backend sin modificar la lista', () => {
    const c = component.criterios()[0];
    criterioServiceFake.cambiarActivo.mockReturnValue(throwError(() => ({ error: { mensaje: 'Debe haber al menos un criterio de evaluación activo' } })));
    component.desactivarCriterio(c);
    expect(component.mensaje()).toBe('Debe haber al menos un criterio de evaluación activo');
    expect(component.criterios().find(x => x.id === c.id)?.activo).toBe(true);
  });

  it('activarCriterio reactiva un criterio inactivo', () => {
    const datos = seisCriterios();
    datos[5].activo = false;
    criterioServiceFake.listarTodos.mockReturnValue(of(datos));
    component.ngOnInit();
    const reactivado = { ...datos[5], activo: true };
    criterioServiceFake.cambiarActivo.mockReturnValue(of(reactivado));
    component.activarCriterio(datos[5]);
    expect(criterioServiceFake.cambiarActivo).toHaveBeenCalledWith(datos[5].id, true);
    expect(component.criterios().find(x => x.id === datos[5].id)?.activo).toBe(true);
  });
});
