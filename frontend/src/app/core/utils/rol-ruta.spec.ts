import { rutaInicialPorRol } from './rol-ruta';

describe('rutaInicialPorRol', () => {
  it('ADMIN va a /admin', () => {
    expect(rutaInicialPorRol('ADMIN')).toBe('/admin');
  });

  it('EVALUADOR va a /evaluador', () => {
    expect(rutaInicialPorRol('EVALUADOR')).toBe('/evaluador');
  });

  it('POSTULANTE va a /portal', () => {
    expect(rutaInicialPorRol('POSTULANTE')).toBe('/portal');
  });
});
