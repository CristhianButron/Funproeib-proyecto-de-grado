package org.certificaciones.funproeibbackend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Prueba de integración real: pasa por Controller -> Service -> Repository ->
 * PostgreSQL (base funproeib_test_db, ver application-integration.properties),
 * sin mockear nada. A diferencia de los tests unitarios de UsuarioServiceImpl
 * (que mockean el repositorio), acá se verifica que el flujo completo
 * registro -> verificación de correo -> login funcione de punta a punta
 * contra una base de datos real.
 */
@SpringBootTest
@ActiveProfiles("integration")
@Transactional
@DisplayName("Integración: registro, verificación de correo y login de usuarios")
class UsuarioControllerIntegrationTest {

    @Autowired private WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private CiudadRepository ciudadRepository;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    // Spy (no mock) sobre el bean real: deja que el envío simulado siga
    // ocurriendo, pero permite capturar la contraseña temporal autogenerada
    // que el registro envía por correo, imposible de adivinar desde afuera.
    @MockitoSpyBean private EmailService emailService;

    private Long idCiudadLaPaz() {
        Ciudad laPaz = ciudadRepository.findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase("La Paz", "Bolivia")
                .orElseThrow(() -> new IllegalStateException("No se sembró La Paz, Bolivia en geodata"));
        return laPaz.getId();
    }

    private Map<String, Object> registroValido(String correo, String ci) {
        return Map.ofEntries(
                Map.entry("nombre", "Carla"),
                Map.entry("apellidoPaterno", "Quispe"),
                Map.entry("correo", correo),
                Map.entry("ci", ci),
                Map.entry("genero", "FEMENINO"),
                Map.entry("fechaNacimiento", "1995-05-05"),
                Map.entry("nivelEducativo", "LICENCIATURA"),
                Map.entry("idCiudad", idCiudadLaPaz()),
                Map.entry("idCiudadNacimiento", idCiudadLaPaz()),
                Map.entry("estadoCivil", "SOLTERO"),
                Map.entry("carreras", java.util.List.of("Pedagogía"))
        );
    }

    @Test
    @DisplayName("Registro crea el usuario sin verificar; login antes de verificar el correo es rechazado")
    void registro_creaUsuarioSinVerificar_loginFallaHastaVerificar() throws Exception {
        String correo = "integracion.registro@gmail.com";

        mockMvc.perform(post("/api/usuarios/registro")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(registroValido(correo, "7001001"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.correo", is(correo)))
                .andExpect(jsonPath("$.rol", is("POSTULANTE")));

        Usuario creado = usuarioRepository.findByCorreo(correo).orElseThrow();
        assertThat(creado.getEmailVerificado()).isFalse();
        assertThat(creado.getTokenVerificacion()).isNotBlank();

        ArgumentCaptor<String> passwordCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviarVerificacionCuenta(eq(correo), any(), any(), passwordCaptor.capture());

        mockMvc.perform(post("/api/usuarios/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "correo", correo, "contrasena", passwordCaptor.getValue()))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensaje", org.hamcrest.Matchers.containsString("verificar")));
    }

    @Test
    @DisplayName("Tras verificar el correo con el token real, el login funciona")
    void verificarCorreo_conTokenReal_permiteLoginDespues() throws Exception {
        String correo = "integracion.verificacion@gmail.com";

        mockMvc.perform(post("/api/usuarios/registro")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(registroValido(correo, "7001002"))))
                .andExpect(status().isCreated());

        String token = usuarioRepository.findByCorreo(correo).orElseThrow().getTokenVerificacion();

        ArgumentCaptor<String> passwordCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviarVerificacionCuenta(eq(correo), any(), any(), passwordCaptor.capture());
        String contrasenaTemporal = passwordCaptor.getValue();

        mockMvc.perform(get("/api/usuarios/verificar-correo").param("token", token))
                .andExpect(status().isNoContent());

        assertThat(usuarioRepository.findByCorreo(correo).orElseThrow().getEmailVerificado()).isTrue();

        mockMvc.perform(post("/api/usuarios/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "correo", correo, "contrasena", contrasenaTemporal))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correo", is(correo)))
                .andExpect(jsonPath("$.debeCambiarPassword", is(true)));
    }

    @Test
    @DisplayName("No se puede registrar dos veces el mismo correo")
    void registro_correoDuplicado_esRechazado() throws Exception {
        String correo = "integracion.duplicado@gmail.com";
        Map<String, Object> request = registroValido(correo, "7001003");

        mockMvc.perform(post("/api/usuarios/registro")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/usuarios/registro")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensaje", org.hamcrest.Matchers.containsString("correo")));
    }
}
