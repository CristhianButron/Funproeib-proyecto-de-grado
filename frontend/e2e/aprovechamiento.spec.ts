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

/**
 * El contexto `request` de Playwright no comparte sesión con `page` (el
 * token queda en el localStorage del navegador, no en cookies), así que
 * para llamar a los endpoints de administrador directamente por API hay
 * que loguearse de nuevo acá y armar el header a mano.
 */
async function tokenAdmin(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/usuarios/login`, {
    data: { correo: 'admin@funproeib.org', contrasena: 'admin12345' },
  });
  if (!res.ok()) throw new Error(`login de admin falló (${res.status()}): ${await res.text()}`);
  return `Bearer ${(await res.json()).token}`;
}

async function crearProgramaAceptado(
  request: APIRequestContext, token: string, idUsuario: number, nombre: string, fechaInicio: string, fechaFin: string,
): Promise<number> {
  const headers = { Authorization: token };
  const resPrograma = await request.post(`${API}/programas`, {
    headers, data: { nombre, tipo: 'TALLER', fechaInicio, fechaFin, cuposDisponibles: 5 },
  });
  expect(resPrograma.ok()).toBeTruthy();
  const idPrograma = (await resPrograma.json()).id;

  await request.patch(`${API}/programas/${idPrograma}/estado`, { headers, params: { estado: 'ABIERTO' } });

  const resPostulacion = await request.post(`${API}/postulaciones`, {
    headers, data: { idUsuario, idPrograma },
  });
  expect(resPostulacion.ok()).toBeTruthy();
  const idPostulacion = (await resPostulacion.json()).id;

  await request.patch(`${API}/postulaciones/${idPostulacion}/estado`, { headers, params: { estado: 'ACEPTADA' } });
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
    const token = await tokenAdmin(request);
    const idCiudad = await idCiudadLaPaz(request);
    const idUsuario = await crearPostulante(request, idCiudad, sufijo, `curso${sufijo}`);
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10);
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 1).toISOString().slice(0, 10);
    const nombrePrograma = `Taller E2E en curso ${sufijo}`;
    await crearProgramaAceptado(request, token, idUsuario, nombrePrograma, fechaInicio, fechaFin);

    await page.goto('/admin/beneficiarios');
    await page.selectOption('select', { label: nombrePrograma });
    // La tabla de Beneficiarios puede tener otras filas: se ubica la de esta
    // prueba por su texto único, igual que ya se hace en reportes más abajo.
    const fila = page.locator('tbody tr', { hasText: 'Beneficiario E2E' });
    await expect(fila).toBeVisible();

    const aprobado = fila.locator('button:has-text("Aprobado")');
    const reprobado = fila.locator('button:has-text("Reprobado")');
    await expect(aprobado).toBeDisabled();
    await expect(reprobado).toBeDisabled();

    // Espera la respuesta real del PATCH antes de revisar la clase del botón,
    // para no correr una carrera contra el round-trip al backend. Se revisa
    // el status primero para que, si el backend rechazó el cambio, la prueba
    // falle mostrando el motivo real en vez de solo "no cambió de clase".
    const [respuesta] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/aprovechamiento') && res.request().method() === 'PATCH'),
      fila.locator('button:has-text("Abandono")').click({ force: true }),
    ]);
    expect(respuesta.ok(), `PATCH aprovechamiento falló (${respuesta.status()}): ${await respuesta.text()}`).toBeTruthy();
    await expect(fila.locator('button:has-text("Abandono")')).toHaveClass(/bg-primary-fixed/);
  });

  test('Aprobado se puede marcar una vez que el programa finalizó, y aparece en el reporte de beneficiarios', async ({ page, request }) => {
    const sufijo = `${Date.now()}`;
    const token = await tokenAdmin(request);
    const idCiudad = await idCiudadLaPaz(request);
    const idUsuario = await crearPostulante(request, idCiudad, sufijo, `fin${sufijo}`);
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1).toISOString().slice(0, 10);
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1).toISOString().slice(0, 10);
    const nombrePrograma = `Taller E2E finalizado ${sufijo}`;
    await crearProgramaAceptado(request, token, idUsuario, nombrePrograma, fechaInicio, fechaFin);

    await page.goto('/admin/beneficiarios');
    await page.selectOption('select', { label: nombrePrograma });
    const fila = page.locator('tbody tr', { hasText: 'Beneficiario E2E' });
    await expect(fila).toBeVisible();

    const aprobado = fila.locator('button:has-text("Aprobado")');
    await expect(aprobado).toBeEnabled();
    const [respuesta] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/aprovechamiento') && res.request().method() === 'PATCH'),
      aprobado.click({ force: true }),
    ]);
    expect(respuesta.ok(), `PATCH aprovechamiento falló (${respuesta.status()}): ${await respuesta.text()}`).toBeTruthy();
    await expect(fila.locator('button:has-text("Aprobado")')).toHaveClass(/bg-secondary-light/);

    // Reportes es de solo lectura: el estado se ve como una insignia de texto,
    // no como un <select> editable (eso ahora vive solo en Beneficiarios). La
    // base puede tener otros beneficiarios reales ya cargados: no asumimos que
    // la fila de la prueba sea la única ni la primera, la ubicamos por su texto único.
    await page.goto('/admin/reportes');
    await page.locator('select').nth(2).selectOption({ label: nombrePrograma });
    const filaReporte = page.locator('tbody tr', { hasText: 'Beneficiario E2E' });
    await expect(filaReporte).toBeVisible();
    await expect(filaReporte.getByText('Aprobado', { exact: true })).toBeVisible();
    await expect(filaReporte.locator('select')).toHaveCount(0);
  });
});
