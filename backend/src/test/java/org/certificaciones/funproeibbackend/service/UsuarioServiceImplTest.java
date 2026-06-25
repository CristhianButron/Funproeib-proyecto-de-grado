package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.LoginRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioRegistroRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.impl.UsuarioServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UsuarioService - registro y autenticación")
class UsuarioServiceImplTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UsuarioServiceImpl service;

    @Test
    @DisplayName("El registro asigna rol POSTULANTE por defecto")
    void registrar_asignaRolPostulante() {
        UsuarioRegistroRequest req = new UsuarioRegistroRequest();
        req.setNombreCompleto("Ana Quispe");
        req.setCorreo("ana@correo.com");
        req.setContrasena("clave1234");
        req.setCi("999888");

        when(usuarioRepository.existsByCorreo("ana@correo.com")).thenReturn(false);
        when(usuarioRepository.existsByCi("999888")).thenReturn(false);
        when(passwordEncoder.encode("clave1234")).thenReturn("HASH");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponse res = service.registrar(req);

        assertThat(res.getRol()).isEqualTo(RolUsuario.POSTULANTE);
        assertThat(res.getCorreo()).isEqualTo("ana@correo.com");
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
    @DisplayName("Login exitoso con credenciales correctas")
    void login_credencialesCorrectas_devuelveUsuario() {
        Usuario usuario = Usuario.builder().id(1L).correo("admin@funproeib.org")
                .contrasenaHash("HASH").rol(RolUsuario.ADMIN).activo(true)
                .nombreCompleto("Admin").build();
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
}
