import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('login con credenciales correctas entra al panel de administración', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[formcontrolname="correo"]', 'admin@funproeib.org');
    await page.fill('input[formcontrolname="contrasena"]', 'admin12345');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText('Administrador Funproeib')).toBeVisible();
  });

  test('login con contraseña incorrecta muestra un error y no entra', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[formcontrolname="correo"]', 'admin@funproeib.org');
    await page.fill('input[formcontrolname="contrasena"]', 'contrasena-incorrecta');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/correo o contraseña incorrectos/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
