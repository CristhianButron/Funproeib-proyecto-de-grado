package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.CambiarPasswordRequest;
import org.certificaciones.funproeibbackend.dto.LoginRequest;
import org.certificaciones.funproeibbackend.dto.RestablecerPasswordRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioActualizarRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioRegistroRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.DocumentoRepository;
import org.certificaciones.funproeibbackend.repository.EvaluacionRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.RespuestaPostulacionRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.security.JwtService;
import org.certificaciones.funproeibbackend.service.impl.UsuarioServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UsuarioService - registro, verificación de correo y autenticación")
class UsuarioServiceImplTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private CiudadRepository ciudadRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private JwtService jwtService;
    @Mock private PostulacionRepository postulacionRepository;
    @Mock private DocumentoRepository documentoRepository;
    @Mock private RespuestaPostulacionRepository respuestaPostulacionRepository;
    @Mock private EvaluacionRepository evaluacionRepository;

    @InjectMocks private UsuarioServiceImpl service;

    @TempDir
    Path carpetaSubidas;

    private MockMultipartFile carnetAnverso;
    private MockMultipartFile carnetReverso;

    // Magic bytes reales: desde que UsuarioServiceImpl valida el contenido
    // real del archivo (no solo la extensión, ver TipoArchivoValidator), un
    // MockMultipartFile con contenido arbitrario ya no pasa la validación.
    private static final byte[] JPEG_VALIDO = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01, 0x02};
    private static final byte[] PNG_VALIDO = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00};

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "uploadsDir", carpetaSubidas.toString());
        carnetAnverso = new MockMultipartFile("carnetAnverso", "anverso.jpg", "image/jpeg", JPEG_VALIDO);
        carnetReverso = new MockMultipartFile("carnetReverso", "reverso.png", "image/png", PNG_VALIDO);
    }

    @Test
    @DisplayName("El registro asigna rol POSTULANTE, genera contraseña temporal y deja la cuenta sin verificar")
    void registrar_asignaRolPostulanteYEnviaVerificacion() {
        UsuarioRegistroRequest req = new UsuarioRegistroRequest();
        req.setNombre("Ana");
        req.setApellidoPaterno("Quispe");
        req.setCorreo("ana@correo.com");
        req.setCi("999888");
        req.setIdCiudad(1L);
        req.setIdCiudadNacimiento(1L);
        req.setNivelEducativo(NivelEducativo.SECUNDARIA);

        Ciudad ciudad = Ciudad.builder().id(1L).nombre("La Paz").build();

        when(usuarioRepository.existsByCorreo("ana@correo.com")).thenReturn(false);
        when(usuarioRepository.existsByCi("999888")).thenReturn(false);
        when(ciudadRepository.findById(1L)).thenReturn(Optional.of(ciudad));
        when(passwordEncoder.encode(anyString())).thenReturn("HASH");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponse res = service.registrar(req, carnetAnverso, carnetReverso);

        assertThat(res.getRol()).isEqualTo(RolUsuario.POSTULANTE);
        assertThat(res.getCorreo()).isEqualTo("ana@correo.com");
        assertThat(res.getEmailVerificado()).isFalse();
        assertThat(res.getIdentidadVerificada()).isFalse();
        assertThat(res.getDebeCambiarPassword()).isTrue();
        verify(emailService).enviarVerificacionCuenta(eq("ana@correo.com"), eq("ANA"), anyString(), anyString());
    }

    @Test
    @DisplayName("El registro guarda las dos fotos del carnet en disco")
    void registrar_guardaFotosDelCarnetEnDisco() {
        UsuarioRegistroRequest req = requestValido();
        Ciudad ciudad = Ciudad.builder().id(1L).nombre("La Paz").build();

        when(usuarioRepository.existsByCorreo("ana@correo.com")).thenReturn(false);
        when(usuarioRepository.existsByCi("999888")).thenReturn(false);
        when(ciudadRepository.findById(1L)).thenReturn(Optional.of(ciudad));
        when(passwordEncoder.encode(anyString())).thenReturn("HASH");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            if (u.getId() == null) u.setId(42L);
            return u;
        });

        UsuarioResponse res = service.registrar(req, carnetAnverso, carnetReverso);

        assertThat(res.getId()).isEqualTo(42L);
        assertThat(carpetaSubidas.resolve("usuario-42/carnet-anverso.jpg")).exists();
        assertThat(carpetaSubidas.resolve("usuario-42/carnet-reverso.png")).exists();
    }

    @Test
    @DisplayName("Rechaza el registro si falta la foto del anverso")
    void registrar_sinCarnetAnverso_lanzaExcepcion() {
        UsuarioRegistroRequest req = requestValido();
        MockMultipartFile vacio = new MockMultipartFile("carnetAnverso", new byte[0]);

        assertThatThrownBy(() -> service.registrar(req, vacio, carnetReverso))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("anverso");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza el registro si la foto del carnet no es una imagen JPG o PNG")
    void registrar_carnetConExtensionNoPermitida_lanzaExcepcion() {
        UsuarioRegistroRequest req = requestValido();
        MockMultipartFile pdf = new MockMultipartFile("carnetAnverso", "anverso.pdf", "application/pdf", "x".getBytes());

        assertThatThrownBy(() -> service.registrar(req, pdf, carnetReverso))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("JPG o PNG");
        verify(usuarioRepository, never()).save(any());
    }

    private UsuarioRegistroRequest requestValido() {
        UsuarioRegistroRequest req = new UsuarioRegistroRequest();
        req.setNombre("Ana");
        req.setApellidoPaterno("Quispe");
        req.setCorreo("ana@correo.com");
        req.setCi("999888");
        req.setIdCiudad(1L);
        req.setIdCiudadNacimiento(1L);
        req.setNivelEducativo(NivelEducativo.SECUNDARIA);
        return req;
    }

    @Test
    @DisplayName("Rechaza el registro si el correo ya existe")
    void registrar_correoDuplicado_lanzaExcepcion() {
        UsuarioRegistroRequest req = new UsuarioRegistroRequest();
        req.setCorreo("ana@correo.com");
        when(usuarioRepository.existsByCorreo("ana@correo.com")).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(req, carnetAnverso, carnetReverso))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("correo");
    }

    @Test
    @DisplayName("Rechaza el registro si el correo es de un proveedor de buzón temporal")
    void registrar_correoDesechable_lanzaExcepcion() {
        UsuarioRegistroRequest req = new UsuarioRegistroRequest();
        req.setCorreo("ana@mailinator.com");
        when(usuarioRepository.existsByCorreo("ana@mailinator.com")).thenReturn(false);

        assertThatThrownBy(() -> service.registrar(req, carnetAnverso, carnetReverso))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("buzón temporal");

        verify(usuarioRepository, never()).existsByCi(anyString());
    }

    @Test
    @DisplayName("Rechaza el registro si el nivel educativo es superior a secundaria y no indica carrera")
    void registrar_nivelSuperiorSinCarreras_lanzaExcepcion() {
        UsuarioRegistroRequest req = new UsuarioRegistroRequest();
        req.setCorreo("ana@correo.com");
        req.setCi("999888");
        req.setNivelEducativo(NivelEducativo.LICENCIATURA);
        req.setCarreras(List.of());

        when(usuarioRepository.existsByCorreo("ana@correo.com")).thenReturn(false);
        when(usuarioRepository.existsByCi("999888")).thenReturn(false);

        assertThatThrownBy(() -> service.registrar(req, carnetAnverso, carnetReverso))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("carrera");
    }

    @Test
    @DisplayName("Permite el registro con nivel superior si indica al menos una carrera")
    void registrar_nivelSuperiorConCarreras_permiteRegistro() {
        UsuarioRegistroRequest req = new UsuarioRegistroRequest();
        req.setNombre("Ana");
        req.setApellidoPaterno("Quispe");
        req.setCorreo("ana@correo.com");
        req.setCi("999888");
        req.setIdCiudad(1L);
        req.setIdCiudadNacimiento(1L);
        req.setNivelEducativo(NivelEducativo.LICENCIATURA);
        req.setCarreras(List.of("Licenciatura en Educación"));

        Ciudad ciudad = Ciudad.builder().id(1L).nombre("La Paz").build();

        when(usuarioRepository.existsByCorreo("ana@correo.com")).thenReturn(false);
        when(usuarioRepository.existsByCi("999888")).thenReturn(false);
        when(ciudadRepository.findById(1L)).thenReturn(Optional.of(ciudad));
        when(passwordEncoder.encode(anyString())).thenReturn("HASH");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponse res = service.registrar(req, carnetAnverso, carnetReverso);

        assertThat(res.getCarreras()).containsExactly("LICENCIATURA EN EDUCACIÓN");
    }

    @Test
    @DisplayName("actualizarPerfil guarda los nuevos datos y los refleja en la respuesta")
    void actualizarPerfil_datosValidos_actualizaYMapea() {
        Usuario usuario = Usuario.builder().id(5L).nombre("Ana").apellidoPaterno("Quispe")
                .ci("1111111").nivelEducativo(NivelEducativo.SECUNDARIA).build();
        UsuarioActualizarRequest req = new UsuarioActualizarRequest();
        req.setNombre("Ana María");
        req.setApellidoPaterno("Quispe");
        req.setCi("2222222");
        req.setIdCiudad(1L);
        req.setIdCiudadNacimiento(1L);
        req.setNivelEducativo(NivelEducativo.SECUNDARIA);
        req.setTelefono("70011111");

        Ciudad ciudad = Ciudad.builder().id(1L).nombre("La Paz").build();
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.existsByCi("2222222")).thenReturn(false);
        when(ciudadRepository.findById(1L)).thenReturn(Optional.of(ciudad));

        UsuarioResponse res = service.actualizarPerfil(5L, req);

        assertThat(res.getNombre()).isEqualTo("ANA MARÍA");
        assertThat(res.getCi()).isEqualTo("2222222");
        assertThat(res.getTelefono()).isEqualTo("70011111");
        verify(usuarioRepository).save(usuario);
    }

    @Test
    @DisplayName("actualizarPerfil permite conservar el mismo CI sin disparar el chequeo de duplicado")
    void actualizarPerfil_mismoCiPropio_noValidaDuplicado() {
        Usuario usuario = Usuario.builder().id(5L).ci("1111111").nivelEducativo(NivelEducativo.SECUNDARIA).build();
        UsuarioActualizarRequest req = new UsuarioActualizarRequest();
        req.setCi("1111111");
        req.setIdCiudad(1L);
        req.setIdCiudadNacimiento(1L);
        req.setNivelEducativo(NivelEducativo.SECUNDARIA);

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(usuario));
        when(ciudadRepository.findById(1L)).thenReturn(Optional.of(Ciudad.builder().id(1L).build()));

        service.actualizarPerfil(5L, req);

        verify(usuarioRepository, never()).existsByCi(anyString());
    }

    @Test
    @DisplayName("actualizarPerfil rechaza el CI si ya lo tiene otro usuario")
    void actualizarPerfil_ciDeOtroUsuario_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(5L).ci("1111111").build();
        UsuarioActualizarRequest req = new UsuarioActualizarRequest();
        req.setCi("9999999");

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.existsByCi("9999999")).thenReturn(true);

        assertThatThrownBy(() -> service.actualizarPerfil(5L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("CI");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("actualizarPerfil exige al menos una carrera si el nivel educativo es superior a secundaria")
    void actualizarPerfil_nivelSuperiorSinCarreras_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(5L).ci("1111111").build();
        UsuarioActualizarRequest req = new UsuarioActualizarRequest();
        req.setCi("1111111");
        req.setNivelEducativo(NivelEducativo.LICENCIATURA);
        req.setCarreras(List.of());

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> service.actualizarPerfil(5L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("carrera");
    }

    @Test
    @DisplayName("Login exitoso con credenciales correctas y correo verificado")
    void login_credencialesCorrectas_devuelveUsuario() {
        Usuario usuario = Usuario.builder().id(1L).correo("admin@funproeib.org")
                .contrasenaHash("HASH").rol(RolUsuario.ADMIN).activo(true).emailVerificado(true)
                .identidadVerificada(true).nombre("Admin").build();
        LoginRequest req = new LoginRequest();
        req.setCorreo("admin@funproeib.org");
        req.setContrasena("admin12345");

        when(usuarioRepository.findByCorreo("admin@funproeib.org")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("admin12345", "HASH")).thenReturn(true);
        when(jwtService.generarToken(1L, RolUsuario.ADMIN)).thenReturn("fake-token");

        UsuarioResponse res = service.login(req);

        assertThat(res.getRol()).isEqualTo(RolUsuario.ADMIN);
        assertThat(res.getToken()).isEqualTo("fake-token");
    }

    @Test
    @DisplayName("Login falla con contraseña incorrecta")
    void login_passwordIncorrecta_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(1L).correo("admin@funproeib.org")
                .contrasenaHash("HASH").activo(true).build();
        LoginRequest req = new LoginRequest();
        req.setCorreo("admin@funproeib.org");
        req.setContrasena("malaclave");

        when(usuarioRepository.findByCorreo("admin@funproeib.org")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("malaclave", "HASH")).thenReturn(false);

        assertThatThrownBy(() -> service.login(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("incorrectos");
    }

    @Test
    @DisplayName("Login falla si el correo todavía no fue verificado")
    void login_correoNoVerificado_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(1L).correo("nueva@correo.com")
                .contrasenaHash("HASH").activo(true).emailVerificado(false).build();
        LoginRequest req = new LoginRequest();
        req.setCorreo("nueva@correo.com");
        req.setContrasena("clave1234");

        when(usuarioRepository.findByCorreo("nueva@correo.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("clave1234", "HASH")).thenReturn(true);

        assertThatThrownBy(() -> service.login(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("verificar");
    }

    @Test
    @DisplayName("Login falla si el correo está verificado pero la identidad todavía no")
    void login_identidadNoVerificada_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(1L).correo("nueva@correo.com")
                .contrasenaHash("HASH").activo(true).emailVerificado(true).identidadVerificada(false).build();
        LoginRequest req = new LoginRequest();
        req.setCorreo("nueva@correo.com");
        req.setContrasena("clave1234");

        when(usuarioRepository.findByCorreo("nueva@correo.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("clave1234", "HASH")).thenReturn(true);

        assertThatThrownBy(() -> service.login(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("revisión");
        verify(jwtService, never()).generarToken(any(), any());
    }

    @Test
    @DisplayName("Verificar correo con token válido marca la cuenta como verificada")
    void verificarCorreo_tokenValido_marcaVerificado() {
        Usuario usuario = Usuario.builder().id(1L).correo("ana@correo.com")
                .emailVerificado(false).tokenVerificacion("token-123")
                .tokenVerificacionExpira(LocalDateTime.now().plusHours(1)).build();

        when(usuarioRepository.findByTokenVerificacion("token-123")).thenReturn(Optional.of(usuario));

        service.verificarCorreo("token-123");

        assertThat(usuario.getEmailVerificado()).isTrue();
        assertThat(usuario.getTokenVerificacion()).isNull();
        verify(usuarioRepository).save(usuario);
    }

    @Test
    @DisplayName("Verificar correo con token vencido lanza excepción")
    void verificarCorreo_tokenExpirado_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(1L).correo("ana@correo.com")
                .emailVerificado(false).tokenVerificacion("token-123")
                .tokenVerificacionExpira(LocalDateTime.now().minusMinutes(1)).build();

        when(usuarioRepository.findByTokenVerificacion("token-123")).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> service.verificarCorreo("token-123"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expiró");
    }

    @Test
    @DisplayName("Verificar correo con token inexistente lanza excepción")
    void verificarCorreo_tokenInvalido_lanzaExcepcion() {
        when(usuarioRepository.findByTokenVerificacion("no-existe")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verificarCorreo("no-existe"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("Cambiar contraseña con la actual correcta la actualiza y desmarca el flag")
    void cambiarPassword_actualCorrecta_actualiza() {
        Usuario usuario = Usuario.builder().id(1L).contrasenaHash("HASH_VIEJO").debeCambiarPassword(true).build();
        CambiarPasswordRequest req = new CambiarPasswordRequest();
        req.setIdUsuario(1L);
        req.setContrasenaActual("temporal123");
        req.setContrasenaNueva("nuevaClave123");

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("temporal123", "HASH_VIEJO")).thenReturn(true);
        when(passwordEncoder.encode("nuevaClave123")).thenReturn("HASH_NUEVO");

        service.cambiarPassword(req);

        assertThat(usuario.getContrasenaHash()).isEqualTo("HASH_NUEVO");
        assertThat(usuario.getDebeCambiarPassword()).isFalse();
    }

    @Test
    @DisplayName("Cambiar contraseña con la actual incorrecta lanza excepción")
    void cambiarPassword_actualIncorrecta_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(1L).contrasenaHash("HASH_VIEJO").debeCambiarPassword(true).build();
        CambiarPasswordRequest req = new CambiarPasswordRequest();
        req.setIdUsuario(1L);
        req.setContrasenaActual("incorrecta");
        req.setContrasenaNueva("nuevaClave123");

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("incorrecta", "HASH_VIEJO")).thenReturn(false);

        assertThatThrownBy(() -> service.cambiarPassword(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("actual");
    }

    @Test
    @DisplayName("Solicitar recuperación con un correo existente genera token y envía el correo")
    void solicitarRecuperacion_correoExiste_generaTokenYEnviaCorreo() {
        Usuario usuario = Usuario.builder().id(1L).correo("ana@correo.com").nombre("Ana").build();
        when(usuarioRepository.findByCorreo("ana@correo.com")).thenReturn(Optional.of(usuario));

        service.solicitarRecuperacionPassword("ana@correo.com");

        assertThat(usuario.getTokenRecuperacion()).isNotBlank();
        assertThat(usuario.getTokenRecuperacionExpira()).isAfter(LocalDateTime.now());
        verify(usuarioRepository).save(usuario);
        verify(emailService).enviarRecuperacionPassword(eq("ana@correo.com"), eq("Ana"), anyString());
    }

    @Test
    @DisplayName("Solicitar recuperación con un correo inexistente no lanza excepción ni envía nada")
    void solicitarRecuperacion_correoNoExiste_noHaceNadaVisible() {
        when(usuarioRepository.findByCorreo("fantasma@correo.com")).thenReturn(Optional.empty());

        service.solicitarRecuperacionPassword("fantasma@correo.com");

        verify(usuarioRepository, never()).save(any());
        verify(emailService, never()).enviarRecuperacionPassword(any(), any(), any());
    }

    @Test
    @DisplayName("Restablecer contraseña con token válido la actualiza y limpia el token")
    void restablecerPassword_tokenValido_actualizaContrasena() {
        Usuario usuario = Usuario.builder().id(1L).contrasenaHash("HASH_VIEJO")
                .tokenRecuperacion("token-456").tokenRecuperacionExpira(LocalDateTime.now().plusMinutes(30))
                .debeCambiarPassword(false).build();
        RestablecerPasswordRequest req = new RestablecerPasswordRequest();
        req.setToken("token-456");
        req.setContrasenaNueva("nuevaClave123");

        when(usuarioRepository.findByTokenRecuperacion("token-456")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.encode("nuevaClave123")).thenReturn("HASH_NUEVO");

        service.restablecerPassword(req);

        assertThat(usuario.getContrasenaHash()).isEqualTo("HASH_NUEVO");
        assertThat(usuario.getTokenRecuperacion()).isNull();
        assertThat(usuario.getTokenRecuperacionExpira()).isNull();
        verify(usuarioRepository).save(usuario);
    }

    @Test
    @DisplayName("Restablecer contraseña con token vencido lanza excepción")
    void restablecerPassword_tokenExpirado_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(1L).tokenRecuperacion("token-456")
                .tokenRecuperacionExpira(LocalDateTime.now().minusMinutes(1)).build();
        RestablecerPasswordRequest req = new RestablecerPasswordRequest();
        req.setToken("token-456");
        req.setContrasenaNueva("nuevaClave123");

        when(usuarioRepository.findByTokenRecuperacion("token-456")).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> service.restablecerPassword(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expiró");
    }

    @Test
    @DisplayName("Restablecer contraseña con token inexistente lanza excepción")
    void restablecerPassword_tokenInvalido_lanzaExcepcion() {
        RestablecerPasswordRequest req = new RestablecerPasswordRequest();
        req.setToken("no-existe");
        req.setContrasenaNueva("nuevaClave123");

        when(usuarioRepository.findByTokenRecuperacion("no-existe")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.restablecerPassword(req))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("Cambiar rol de un postulante a evaluador funciona sin restricciones")
    void cambiarRol_postulanteAEvaluador_permiteCambio() {
        Usuario usuario = Usuario.builder().id(2L).rol(RolUsuario.POSTULANTE).activo(true).build();
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuario));

        UsuarioResponse res = service.cambiarRol(2L, RolUsuario.EVALUADOR);

        assertThat(res.getRol()).isEqualTo(RolUsuario.EVALUADOR);
        verify(usuarioRepository).save(usuario);
    }

    @Test
    @DisplayName("Cambiar rol al mismo valor no hace nada (no guarda)")
    void cambiarRol_mismoRol_noGuarda() {
        Usuario usuario = Usuario.builder().id(2L).rol(RolUsuario.POSTULANTE).activo(true).build();
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuario));

        service.cambiarRol(2L, RolUsuario.POSTULANTE);

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza degradar al último administrador activo")
    void cambiarRol_ultimoAdminActivo_lanzaExcepcion() {
        Usuario admin = Usuario.builder().id(1L).rol(RolUsuario.ADMIN).activo(true).build();
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> service.cambiarRol(1L, RolUsuario.POSTULANTE))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("administrador");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Permite degradar a un admin si hay otro administrador activo")
    void cambiarRol_hayOtroAdminActivo_permiteCambio() {
        Usuario admin = Usuario.builder().id(1L).rol(RolUsuario.ADMIN).activo(true).build();
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN)).thenReturn(2L);

        UsuarioResponse res = service.cambiarRol(1L, RolUsuario.EVALUADOR);

        assertThat(res.getRol()).isEqualTo(RolUsuario.EVALUADOR);
    }

    @Test
    @DisplayName("Rechaza desactivar al último administrador activo")
    void cambiarActivo_ultimoAdminActivo_lanzaExcepcion() {
        Usuario admin = Usuario.builder().id(1L).rol(RolUsuario.ADMIN).activo(true).build();
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> service.cambiarActivo(1L, false))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("administrador");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Permite desactivar a un postulante sin restricciones")
    void cambiarActivo_postulante_permiteDesactivar() {
        Usuario postulante = Usuario.builder().id(3L).rol(RolUsuario.POSTULANTE).activo(true).build();
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(postulante));

        UsuarioResponse res = service.cambiarActivo(3L, false);

        assertThat(res.getActivo()).isFalse();
        verify(usuarioRepository).save(postulante);
    }

    @Test
    @DisplayName("Reactivar un usuario no dispara la validación del último admin")
    void cambiarActivo_reactivar_noValida() {
        Usuario postulante = Usuario.builder().id(3L).rol(RolUsuario.POSTULANTE).activo(false).build();
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(postulante));

        UsuarioResponse res = service.cambiarActivo(3L, true);

        assertThat(res.getActivo()).isTrue();
        verify(usuarioRepository, never()).countByRolAndActivoTrue(any());
    }

    @Test
    @DisplayName("obtenerCarnet devuelve el archivo cuando existe en disco")
    void obtenerCarnet_archivoExiste_devuelveRecurso() throws Exception {
        Path carpeta = carpetaSubidas.resolve("usuario-7");
        Files.createDirectories(carpeta);
        Files.writeString(carpeta.resolve("carnet-anverso.jpg"), "contenido");
        Usuario usuario = Usuario.builder().id(7L).rutaCarnetAnverso("usuario-7/carnet-anverso.jpg").build();
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));

        ArchivoDescargable archivo = service.obtenerCarnet(7L, true);

        assertThat(archivo.getNombreArchivo()).isEqualTo("carnet-anverso.jpg");
    }

    @Test
    @DisplayName("obtenerCarnet lanza excepción si el usuario no tiene esa foto cargada")
    void obtenerCarnet_sinRuta_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(7L).build();
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> service.obtenerCarnet(7L, true))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("verificarIdentidad marca la cuenta como verificada cuando tiene las dos fotos")
    void verificarIdentidad_conFotos_marcaVerificada() {
        Usuario usuario = Usuario.builder().id(7L)
                .rutaCarnetAnverso("usuario-7/carnet-anverso.jpg")
                .rutaCarnetReverso("usuario-7/carnet-reverso.jpg")
                .identidadVerificada(false).build();
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponse res = service.verificarIdentidad(7L);

        assertThat(res.getIdentidadVerificada()).isTrue();
    }

    @Test
    @DisplayName("verificarIdentidad lanza excepción si faltan las fotos del carnet")
    void verificarIdentidad_sinFotos_lanzaExcepcion() {
        Usuario usuario = Usuario.builder().id(7L).build();
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> service.verificarIdentidad(7L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("faltan");
        verify(usuarioRepository, never()).save(any());
    }

    // Rechazar la identidad no deja un estado "rechazada" guardado: se
    // considera un intento de falsificación, así que se da de baja la cuenta
    // completa (y todas sus postulaciones, documentos, respuestas y
    // evaluaciones) y se le avisa por correo.
    @Test
    @DisplayName("rechazarIdentidad elimina la cuenta, sus postulaciones y envía el correo")
    void rechazarIdentidad_eliminaCuentaYEnviaCorreo() {
        Usuario usuario = Usuario.builder().id(7L).correo("ana@correo.com").nombre("Ana").build();
        Postulacion postulacion = Postulacion.builder().id(50L).usuario(usuario).build();
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));
        when(postulacionRepository.findByUsuarioId(7L)).thenReturn(List.of(postulacion));
        when(evaluacionRepository.findByPostulacionId(50L)).thenReturn(Optional.empty());
        when(respuestaPostulacionRepository.findByPostulacionId(50L)).thenReturn(List.of());
        when(documentoRepository.findByPostulacionId(50L)).thenReturn(List.of());

        service.rechazarIdentidad(7L);

        verify(postulacionRepository).deleteAll(List.of(postulacion));
        verify(usuarioRepository).delete(usuario);
        verify(emailService).enviarRechazoIdentidad("ana@correo.com", "Ana");
    }

    @Test
    @DisplayName("listarPendientesIdentidad devuelve solo las cuentas sin identidad verificada")
    void listarPendientesIdentidad_filtraSoloNoVerificados() {
        Usuario verificado = Usuario.builder().id(1L).identidadVerificada(true).build();
        Usuario pendiente = Usuario.builder().id(2L).identidadVerificada(false).build();
        Usuario legacySinDato = Usuario.builder().id(3L).identidadVerificada(null).build();
        when(usuarioRepository.findAllConUbicacion()).thenReturn(List.of(verificado, pendiente, legacySinDato));

        List<UsuarioResponse> res = service.listarPendientesIdentidad();

        assertThat(res).extracting(UsuarioResponse::getId).containsExactlyInAnyOrder(2L, 3L);
    }

    // No es rechazarIdentidad: esta es una baja administrativa normal (sin
    // correo de aviso), para cuentas que ya no corresponde que existan.
    @Test
    @DisplayName("eliminar borra la cuenta y sus postulaciones, sin enviar correo")
    void eliminar_postulante_eliminaCuentaYPostulaciones() {
        Usuario usuario = Usuario.builder().id(8L).rol(RolUsuario.POSTULANTE).build();
        Postulacion postulacion = Postulacion.builder().id(60L).usuario(usuario).build();
        when(usuarioRepository.findById(8L)).thenReturn(Optional.of(usuario));
        when(evaluacionRepository.existsByEvaluadorId(8L)).thenReturn(false);
        when(postulacionRepository.findByUsuarioId(8L)).thenReturn(List.of(postulacion));
        when(evaluacionRepository.findByPostulacionId(60L)).thenReturn(Optional.empty());
        when(respuestaPostulacionRepository.findByPostulacionId(60L)).thenReturn(List.of());
        when(documentoRepository.findByPostulacionId(60L)).thenReturn(List.of());

        service.eliminar(8L);

        verify(postulacionRepository).deleteAll(List.of(postulacion));
        verify(usuarioRepository).delete(usuario);
        verify(emailService, never()).enviarRechazoIdentidad(any(), any());
    }

    @Test
    @DisplayName("eliminar rechaza si el usuario ya registró evaluaciones como evaluador")
    void eliminar_evaluadorConEvaluaciones_lanzaExcepcion() {
        Usuario evaluador = Usuario.builder().id(9L).rol(RolUsuario.EVALUADOR).build();
        when(usuarioRepository.findById(9L)).thenReturn(Optional.of(evaluador));
        when(evaluacionRepository.existsByEvaluadorId(9L)).thenReturn(true);

        assertThatThrownBy(() -> service.eliminar(9L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Desactíva");
        verify(usuarioRepository, never()).delete(any());
    }

    @Test
    @DisplayName("eliminar rechaza borrar al último administrador activo")
    void eliminar_ultimoAdminActivo_lanzaExcepcion() {
        Usuario admin = Usuario.builder().id(1L).rol(RolUsuario.ADMIN).activo(true).build();
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> service.eliminar(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("administrador");
        verify(usuarioRepository, never()).delete(any());
    }
}
