# Pruebas de sistema (end-to-end, caja negra)

Estas pruebas manejan un navegador real (Playwright) contra la aplicación
completa: frontend (`ng serve`, puerto 4200), backend (Spring Boot, puerto
8080) y base de datos (PostgreSQL) corriendo al mismo tiempo. No mockean
nada — son pruebas de sistema / caja negra: solo ven lo que vería una
persona usando el sistema.

## Antes de correrlas

1. Que exista la base de datos de desarrollo (una sola vez):
   ```
   psql -U postgres -h localhost -c "CREATE DATABASE funproeib_db;"
   ```
2. Levantar el backend (desde `backend/`):
   ```
   ./mvnw spring-boot:run
   ```
3. Levantar el frontend (desde `frontend/`, en otra terminal):
   ```
   npm start
   ```
4. Instalar los navegadores de Playwright (una sola vez, desde `frontend/`):
   ```
   npx playwright install chromium
   ```

## Correrlas

Desde `frontend/`, con el backend y el frontend del paso anterior ya
corriendo:

```
npm run e2e
```

Esto corre todos los archivos `e2e/*.spec.ts` en Chromium y deja un reporte
HTML en `playwright-report/` (abrilo con `npx playwright show-report`).

- Todo en verde (✓) en la terminal = las pruebas pasaron.
- Si algo falla, Playwright guarda automáticamente una captura de pantalla y
  una traza (`trace.zip`) del momento exacto de la falla; `npx playwright
  show-report` las muestra.

Para correr un solo archivo: `npx playwright test e2e/auth.spec.ts`.
Para verlo paso a paso con el navegador visible: `npx playwright test --headed --debug`.

## Qué cubre cada archivo

- `auth.spec.ts` — login correcto e incorrecto (objetivo 2: autenticación).
- `aprovechamiento.spec.ts` — el ciclo de vida completo de un beneficiario:
  aceptar su postulación, marcar Abandono en cualquier momento, y que
  Aprobado/Reprobado solo se puedan registrar una vez que el programa
  finalizó, verificando además que el resultado aparece en el reporte de
  beneficiarios (objetivos 5, 6 y 7).

Estas pruebas crean sus propios datos (usuarios y programas con correos/CI
únicos por ejecución) directamente contra la API real como preparación —no
a través de la interfaz—, y recién ahí usan la interfaz para la parte que
están verificando. Eso es intencional: evita que la prueba dependa de datos
que alguien haya cargado a mano, y mantiene rápida la parte de preparación.

## Limitación conocida

El flujo de registro de un postulante nuevo exige verificar el correo con
un token que, en desarrollo, nunca se envía de verdad (se escribe en el log
del backend). Por eso estas pruebas no cubren el recorrido completo "una
persona se registra sola y luego inicia sesión" — solo lo que se puede
probar sin depender de un correo real. Si se configura un SMTP de prueba
(ver `app.mail.enabled` en `application.properties`), se podría extender.
