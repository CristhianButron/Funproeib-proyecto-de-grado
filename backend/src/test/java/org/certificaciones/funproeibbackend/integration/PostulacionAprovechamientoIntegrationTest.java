package org.certificaciones.funproeibbackend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Prueba de integración real (Controller -> Service -> Repository ->
 * PostgreSQL, base funproeib_test_db) de la regla de negocio agregada en
 * esta sesión: el estado final de aprovechamiento (Pendiente / Abandono /
 * Aprobado / Reprobado) de un beneficiario.
 *
 * Cubre, con peticiones HTTP reales sobre una base real, exactamente lo que
 * antes solo se había verificado a mano con curl + Playwright durante el
 * desarrollo:
 *   - Abandono se puede registrar en cualquier momento (programa en curso).
 *   - Aprobado/Reprobado se rechazan mientras el programa no haya finalizado.
 *   - Una vez finalizado, Aprobado/Reprobado sí se pueden registrar.
 *
 * Con .apply(springSecurity()) el filtro de JWT/roles real queda activo
 * (no se lo salta como el resto de las pruebas de controlador), así que
 * las peticiones administrativas llevan un token real generado por
 * JwtService para el admin que ya siembra DataInitializer.
 */
@SpringBootTest
@ActiveProfiles("integration")
@Transactional
@DisplayName("Integración: ciclo de vida de una postulación y su aprovechamiento")
class PostulacionAprovechamientoIntegrationTest {

    @Autowired private WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired private CiudadRepository ciudadRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private JwtService jwtService;

    private String tokenAdmin;

    @TempDir
    static Path carpetaSubidas;

    @DynamicPropertySource
    static void propiedades(DynamicPropertyRegistry registry) {
        registry.add("app.uploads.dir", () -> carpetaSubidas.toString());
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
        Usuario admin = usuarioRepository.findByCorreo("admin@funproeib.org").orElseThrow();
        tokenAdmin = "Bearer " + jwtService.generarToken(admin.getId(), admin.getRol());
    }

    private Long idCiudadLaPaz() {
        Ciudad laPaz = ciudadRepository.findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase("La Paz", "Bolivia")
                .orElseThrow();
        return laPaz.getId();
    }

    /** Registra un postulante nuevo (vía API real, pública) y devuelve su id. */
    private Long crearPostulante(String correo, String ci) throws Exception {
        Map<String, Object> request = Map.ofEntries(
                Map.entry("nombre", "Beneficiario"),
                Map.entry("apellidoPaterno", "DePrueba"),
                Map.entry("correo", correo),
                Map.entry("ci", ci),
                Map.entry("genero", "FEMENINO"),
                Map.entry("fechaNacimiento", "1995-05-05"),
                Map.entry("nivelEducativo", "LICENCIATURA"),
                Map.entry("idCiudad", idCiudadLaPaz()),
                Map.entry("idCiudadNacimiento", idCiudadLaPaz()),
                Map.entry("estadoCivil", "SOLTERO"),
                Map.entry("carreras", List.of("Pedagogía"))
        );
        // El registro ahora exige las dos fotos del carnet (multipart/form-data);
        // esta prueba no inicia sesión como el postulante, solo lo crea.
        MockMultipartFile datos = new MockMultipartFile("datos", "datos.json", "application/json",
                objectMapper.writeValueAsBytes(request));
        MockMultipartFile carnetAnverso = new MockMultipartFile("carnetAnverso", "anverso.jpg", "image/jpeg", "img".getBytes());
        MockMultipartFile carnetReverso = new MockMultipartFile("carnetReverso", "reverso.jpg", "image/jpeg", "img".getBytes());

        String body = mockMvc.perform(multipart("/api/usuarios/registro")
                        .file(datos).file(carnetAnverso).file(carnetReverso))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) objectMapper.readValue(body, Map.class).get("id")).longValue();
    }

    /** Crea un programa con las fechas dadas y lo abre (acciones de admin). Devuelve su id. */
    private Long crearProgramaAbierto(String nombre, LocalDate fechaInicio, LocalDate fechaFin) throws Exception {
        Map<String, Object> request = Map.of(
                "nombre", nombre, "tipo", "TALLER", "edicion", "2026",
                "fechaInicio", fechaInicio.toString(), "fechaFin", fechaFin.toString(),
                "cuposDisponibles", 5
        );
        String body = mockMvc.perform(post("/api/programas")
                        .header("Authorization", tokenAdmin)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long id = ((Number) objectMapper.readValue(body, Map.class).get("id")).longValue();

        mockMvc.perform(patch("/api/programas/{id}/estado", id).header("Authorization", tokenAdmin).param("estado", "ABIERTO"))
                .andExpect(status().isOk());
        return id;
    }

    private Long crearPostulacionAceptada(Long idUsuario, Long idPrograma) throws Exception {
        String body = mockMvc.perform(post("/api/postulaciones")
                        .header("Authorization", tokenAdmin)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idUsuario", idUsuario, "idPrograma", idPrograma))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long idPostulacion = ((Number) objectMapper.readValue(body, Map.class).get("id")).longValue();

        mockMvc.perform(patch("/api/postulaciones/{id}/estado", idPostulacion)
                        .header("Authorization", tokenAdmin).param("estado", "ACEPTADA"))
                .andExpect(status().isOk());
        return idPostulacion;
    }

    @Test
    @DisplayName("Abandono se puede registrar aunque el programa todavía esté en curso")
    void registrarAbandono_programaEnCurso_seRegistraCorrectamente() throws Exception {
        Long idUsuario = crearPostulante("integracion.abandono@gmail.com", "7002001");
        Long idPrograma = crearProgramaAbierto("Taller en curso (integración)",
                LocalDate.now().minusDays(5), LocalDate.now().plusMonths(2));
        Long idPostulacion = crearPostulacionAceptada(idUsuario, idPrograma);

        mockMvc.perform(patch("/api/postulaciones/{id}/aprovechamiento", idPostulacion)
                        .header("Authorization", tokenAdmin).param("estado", "ABANDONO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoAprovechamiento", is("ABANDONO")));
    }

    @Test
    @DisplayName("Aprobado se rechaza mientras el programa no haya finalizado")
    void registrarAprobado_programaEnCurso_esRechazado() throws Exception {
        Long idUsuario = crearPostulante("integracion.aprobadotemprano@gmail.com", "7002002");
        Long idPrograma = crearProgramaAbierto("Taller en curso 2 (integración)",
                LocalDate.now().minusDays(5), LocalDate.now().plusMonths(2));
        Long idPostulacion = crearPostulacionAceptada(idUsuario, idPrograma);

        mockMvc.perform(patch("/api/postulaciones/{id}/aprovechamiento", idPostulacion)
                        .header("Authorization", tokenAdmin).param("estado", "APROBADO"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensaje", org.hamcrest.Matchers.containsString("finalice")));
    }

    @Test
    @DisplayName("Aprobado se acepta una vez que el programa ya finalizó")
    void registrarAprobado_programaFinalizado_seRegistraCorrectamente() throws Exception {
        Long idUsuario = crearPostulante("integracion.aprobadofinal@gmail.com", "7002003");
        Long idPrograma = crearProgramaAbierto("Taller finalizado (integración)",
                LocalDate.now().minusMonths(3), LocalDate.now().minusDays(1));
        Long idPostulacion = crearPostulacionAceptada(idUsuario, idPrograma);

        mockMvc.perform(patch("/api/postulaciones/{id}/aprovechamiento", idPostulacion)
                        .header("Authorization", tokenAdmin).param("estado", "APROBADO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoAprovechamiento", is("APROBADO")));
    }

    @Test
    @DisplayName("El reporte de beneficiarios refleja el aprovechamiento registrado")
    void reporteDeBeneficiarios_incluyeElAprovechamientoRegistrado() throws Exception {
        Long idUsuario = crearPostulante("integracion.reporte@gmail.com", "7002004");
        Long idPrograma = crearProgramaAbierto("Taller para reporte (integración)",
                LocalDate.now().minusMonths(3), LocalDate.now().minusDays(1));
        Long idPostulacion = crearPostulacionAceptada(idUsuario, idPrograma);

        mockMvc.perform(patch("/api/postulaciones/{id}/aprovechamiento", idPostulacion)
                        .header("Authorization", tokenAdmin).param("estado", "REPROBADO"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/reportes/beneficiarios")
                        .header("Authorization", tokenAdmin).param("idPrograma", idPrograma.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].estadoAprovechamiento", is("REPROBADO")))
                .andExpect(jsonPath("$[0].idPostulacion", is(idPostulacion.intValue())));
    }
}
