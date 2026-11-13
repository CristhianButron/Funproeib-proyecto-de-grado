import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de sistema (caja negra): manejan el navegador como lo haría una
 * persona real, contra la aplicación completa (frontend + backend + base de
 * datos) ya levantada. No arrancan nada por sí solas —ver e2e/README.md para
 * los requisitos previos— porque orquestar Angular + Spring Boot + Postgres
 * desde Playwright sería más frágil que simplemente dejar que el desarrollador
 * levante ambos como ya hace para probar manualmente.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
