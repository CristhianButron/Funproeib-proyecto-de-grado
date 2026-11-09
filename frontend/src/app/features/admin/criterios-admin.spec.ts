import { of, throwError } from 'rxjs';
import { CriteriosAdminComponent } from './criterios-admin';
import { CriterioEvaluacionResponse } from '../../core/models/evaluacion.model';

function criterio(id: number, orden: number, nombreCriterio: string, activo = true): CriterioEvaluacionResponse {
  return { id, orden, nombreCriterio, descripcion: '', activo };
}

describe('CriteriosAdminComponent (lógica)', () => {
  let component: CriteriosAdminComponent;
  let criterioServiceFake: any;

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
    component = new CriteriosAdminComponent(criterioServiceFake);
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

  it('agregar rechaza un nombre vacío sin llamar al servicio', () => {
    component.nuevo = { nombreCriterio: '   ', descripcion: '' };
    component.agregar();
    expect(criterioServiceFake.crear).not.toHaveBeenCalled();
    expect(component.mensaje()).toContain('nombre');
  });

  it('agregar exitoso agrega el criterio a la lista y recorta espacios', () => {
    const nuevo = criterio(7, 7, 'Puntualidad');
    criterioServiceFake.crear.mockReturnValue(of(nuevo));
    component.nuevo = { nombreCriterio: '  Puntualidad  ', descripcion: '' };
    component.agregar();
    expect(criterioServiceFake.crear).toHaveBeenCalledWith({ nombreCriterio: 'Puntualidad', descripcion: undefined });
    expect(component.criterios()).toHaveLength(7);
    expect(component.nuevo.nombreCriterio).toBe('');
  });

  it('agregar con error del backend lo muestra', () => {
    criterioServiceFake.crear.mockReturnValue(throwError(() => ({ error: { mensaje: 'Ya existe un criterio con ese nombre' } })));
    component.nuevo = { nombreCriterio: 'Repetido', descripcion: '' };
    component.agregar();
    expect(component.mensaje()).toBe('Ya existe un criterio con ese nombre');
    expect(component.mensajeError()).toBe(true);
  });

  it('iniciarEdicion precarga el formulario y cancelarEdicion lo cierra', () => {
    const c = component.criterios()[0];
    component.iniciarEdicion(c);
    expect(component.editandoId()).toBe(c.id);
    expect(component.edicion.nombreCriterio).toBe(c.nombreCriterio);
    component.cancelarEdicion();
    expect(component.editandoId()).toBeNull();
  });

  it('guardarEdicion actualiza el criterio en la lista', () => {
    const c = component.criterios()[0];
    const actualizado = { ...c, nombreCriterio: 'Nuevo nombre' };
    criterioServiceFake.actualizar.mockReturnValue(of(actualizado));
    component.iniciarEdicion(c);
    component.edicion.nombreCriterio = 'Nuevo nombre';
    component.guardarEdicion(c);
    expect(component.criterios().find(x => x.id === c.id)?.nombreCriterio).toBe('Nuevo nombre');
    expect(component.editandoId()).toBeNull();
  });

  it('desactivar actualiza el estado activo del criterio en la lista', () => {
    const c = component.criterios()[0];
    const desactivado = { ...c, activo: false };
    criterioServiceFake.cambiarActivo.mockReturnValue(of(desactivado));
    component.desactivar(c);
    expect(criterioServiceFake.cambiarActivo).toHaveBeenCalledWith(c.id, false);
    expect(component.criterios().find(x => x.id === c.id)?.activo).toBe(false);
  });

  it('desactivar el último activo muestra el error del backend sin modificar la lista', () => {
    const c = component.criterios()[0];
    criterioServiceFake.cambiarActivo.mockReturnValue(throwError(() => ({ error: { mensaje: 'Debe haber al menos un criterio de evaluación activo' } })));
    component.desactivar(c);
    expect(component.mensaje()).toBe('Debe haber al menos un criterio de evaluación activo');
    expect(component.criterios().find(x => x.id === c.id)?.activo).toBe(true);
  });
});
