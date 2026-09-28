import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuarioService } from './usuario.service';

describe('UsuarioService (llamadas HTTP)', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;
  const base = 'http://localhost:8080/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('registrar hace POST a /usuarios/registro con el body dado', () => {
    const body = { correo: 'a@b.com' } as any;
    service.registrar(body).subscribe();
    const req = httpMock.expectOne(`${base}/usuarios/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(body);
    req.flush({});
  });

  it('login hace POST a /usuarios/login', () => {
    service.login({ correo: 'a@b.com', contrasena: '123' }).subscribe();
    const req = httpMock.expectOne(`${base}/usuarios/login`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('obtenerPorId hace GET a /usuarios/{id}', () => {
    service.obtenerPorId(5).subscribe();
    const req = httpMock.expectOne(`${base}/usuarios/5`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('listarTodos hace GET a /usuarios', () => {
    service.listarTodos().subscribe();
    const req = httpMock.expectOne(`${base}/usuarios`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('verificarCorreo hace GET con el token en la query string', () => {
    service.verificarCorreo('abc-123').subscribe();
    const req = httpMock.expectOne(`${base}/usuarios/verificar-correo?token=abc-123`);
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('reenviarVerificacion hace POST a /usuarios/reenviar-verificacion', () => {
    service.reenviarVerificacion({ correo: 'a@b.com' }).subscribe();
    const req = httpMock.expectOne(`${base}/usuarios/reenviar-verificacion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ correo: 'a@b.com' });
    req.flush(null);
  });

  it('cambiarPassword hace POST a /usuarios/cambiar-password', () => {
    const body = { idUsuario: 1, contrasenaActual: 'a', contrasenaNueva: 'b' };
    service.cambiarPassword(body).subscribe();
    const req = httpMock.expectOne(`${base}/usuarios/cambiar-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(null);
  });

  it('cambiarRol hace PATCH a /usuarios/{id}/rol con el rol en la query string', () => {
    service.cambiarRol(7, 'EVALUADOR').subscribe();
    const req = httpMock.expectOne(`${base}/usuarios/7/rol?rol=EVALUADOR`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('cambiarActivo hace PATCH a /usuarios/{id}/activo con el valor en la query string', () => {
    service.cambiarActivo(7, false).subscribe();
    const req = httpMock.expectOne(`${base}/usuarios/7/activo?activo=false`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
