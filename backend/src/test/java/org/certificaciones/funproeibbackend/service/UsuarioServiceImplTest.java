package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.CambiarPasswordRequest;
import org.certificaciones.funproeibbackend.dto.LoginRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioRegistroRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.impl.UsuarioServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

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

    @InjectMocks private UsuarioServiceImpl service;

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

        UsuarioResponse res = service.registrar(req);

        assertThat(res.getRol()).isEqualTo(RolUsuario.POSTULANTE);
        assertThat(res.getCorreo()).isEqualTo("ana@correo.com");
        assertThat(res.getEmailVerificado()).isFalse();
        assertThat(res.getDebeCambiarPassword()).isTrue();
        verify(emailService).enviarVerificacionCuenta(eq("ana@correo.com"), eq("Ana"), anyString(), anyString());
    }

    @Test
    @DisplayName("Rechaza el registro si el correo ya existe")
    void registrar_correoDuplicado_lanzaExcepcion() {
        UsuarioRegistroRequest req = new UsuarioRegistroRequest();
        req.setCorreo("ana@correo.com");
        when(usuarioRepository.existsByCorreo("ana@correo.com")).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("correo");
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

        assertThatThrownBy(() -> service.registrar(req))
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

        UsuarioResponse res = service.registrar(req);

        assertThat(res.getCarreras()).containsExactly("Licenciatura en Educación");
    }

    @Test
    @DisplayName("Login exitoso con credenciales correctas y correo verificado")
    void login_credencialesCorrectas_devuelveUsuario() {
        Usuario usuario = Usuario.builder().id(1L).correo("admin@funproeib.org")
                .contrasenaHash("HASH").rol(RolUsuario.ADMIN).activo(true).emailVerificado(true)
                .nombre("Admin").build();
        LoginRequest req = new LoginRequest();
        req.setCorreo("admin@funproeib.org");
        req.setContrasena("admin12345");

        when(usuarioRepository.findByCorreo("admin@funproeib.org")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("admin12345", "HASH")).thenReturn(true);

        UsuarioResponse res = service.login(req);

        assertThat(res.getRol()).isEqualTo(RolUsuario.ADMIN);
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
}
