import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:8080/api';

/**
 * El registro/postulación en sí ya se prueba a mano con la interfaz en otros
 * flujos; acá nos interesa el estado final de aprovechamiento, así que la
 * preparación (crear postulante, programa y postulación aceptada) se hace
 * directo contra la API real para no depender de esos pasos ni del correo de
 * verificación (ver e2e/README.md).
 */
async function crearPostulante(request: APIRequestContext, idCiudad: number, sufijoNumerico: string, etiqueta: string) {
  const res = await request.post(`${API}/usuarios/registro`, {
    data: {
      nombre: 'Beneficiario', apellidoPaterno: 'E2E',
      correo: `e2e.aprovechamiento.${etiqueta}@gmail.com`,
      ci: `80${sufijoNumerico}`,
      genero: 'FEMENINO', fechaNacimiento: '1995-05-05', nivelEducativo: 'LICENCIATURA',
      idCiudad, idCiudadNacimiento: idCiudad, estadoCivil: 'SOLTERO', carreras: ['Pedagogía'],
    },
  });
  if (!res.ok()) throw new Error(`registro falló (${res.status()}): ${await res.text()}`);
  return (await res.json()).id as number;
}

async function idCiudadLaPaz(request: APIRequestContext): Promise<number> {
  const res = await request.get(`${API}/ubicaciones/paises`);
  const paises = await res.json();
  const bolivia = paises.find((p: { nombre: string }) => p.nombre === 'Bolivia');
  const ciudades = await (await request.get(`${API}/ubicaciones/paises/${bolivia.id}/ciudades`)).json();
  const laPaz = ciudades.find((c: { nombre: string }) => c.nombre === 'La Paz');
  return laPaz.id;
}

async function crearProgramaAceptado(
  request: APIRequestContext, idUsuario: number, nombre: string, fechaInicio: string, fechaFin: string,
): Promise<number> {
  const resPrograma = await request.post(`${API}/programas`, {
    data: { nombre, tipo: 'TALLER', fechaInicio, fechaFin, cuposDisponibles: 5 },
  });
  expect(resPrograma.ok()).toBeTruthy();
  const idPrograma = (await resPrograma.json()).id;

  await request.patch(`${API}/programas/${idPrograma}/estado`, { params: { estado: 'ABIERTO' } });

  const resPostulacion = await request.post(`${API}/postulaciones`, {
    data: { idUsuario, idPrograma },
  });
  expect(resPostulacion.ok()).toBeTruthy();
  const idPostulacion = (await resPostulacion.json()).id;

  await request.patch(`${API}/postulaciones/${idPostulacion}/estado`, { params: { estado: 'ACEPTADA' } });
  return idPrograma;
}

test.describe('Estado final de aprovechamiento de beneficiarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[formcontrolname="correo"]', 'admin@funproeib.org');
    await page.fill('input[formcontrolname="contrasena"]', 'admin12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('Abandono se puede marcar con el programa en curso; Aprobado/Reprobado quedan deshabilitados', async ({ page, request }) => {
    const sufijo = `${Date.now()}`;
    const idCiudad = await idCiudadLaPaz(request);
    const idUsuario = await crearPostulante(request, idCiudad, sufijo, `curso${sufijo}`);
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10);
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 1).toISOString().slice(0, 10);
    const nombrePrograma = `Taller E2E en curso ${sufijo}`;
    await crearProgramaAceptado(request, idUsuario, nombrePrograma, fechaInicio, fechaFin);

    await page.goto('/admin/postulantes');
    await page.selectOption('select', { label: nombrePrograma });
    // force: la fila todavía se está reacomodando (carga async) cuando Playwright
    // intenta el clic, y por una fracción de segundo otro elemento queda encima.
    await page.click('button:has-text("Ver ficha")', { force: true });

    const aprobado = page.locator('button:has-text("Aprobado")');
    const reprobado = page.locator('button:has-text("Reprobado")');
    await expect(aprobado).toBeDisabled();
    await expect(reprobado).toBeDisabled();

    await page.click('button:has-text("Abandono")');
    await expect(page.locator('button:has-text("Abandono")')).toHaveClass(/bg-primary-fixed/);
  });

  test('Aprobado se puede marcar una vez que el programa finalizó, y aparece en el reporte de beneficiarios', async ({ page, request }) => {
    const sufijo = `${Date.now()}`;
    const idCiudad = await idCiudadLaPaz(request);
    const idUsuario = await crearPostulante(request, idCiudad, sufijo, `fin${sufijo}`);
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1).toISOString().slice(0, 10);
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1).toISOString().slice(0, 10);
    const nombrePrograma = `Taller E2E finalizado ${sufijo}`;
    await crearProgramaAceptado(request, idUsuario, nombrePrograma, fechaInicio, fechaFin);

    await page.goto('/admin/postulantes');
    await page.selectOption('select', { label: nombrePrograma });
    await page.click('button:has-text("Ver ficha")', { force: true });

    const aprobado = page.locator('button:has-text("Aprobado")');
    await expect(aprobado).toBeEnabled();
    await aprobado.click();
    await expect(page.locator('button:has-text("Aprobado")')).toHaveClass(/bg-secondary-light/);

    await page.goto('/admin/reportes');
    await page.locator('select').nth(2).selectOption({ label: nombrePrograma });
    await expect(page.locator('tbody tr').first()).toContainText('Beneficiario E2E');
    await expect(page.locator('tbody select')).toHaveValue('APROBADO');
  });
});
