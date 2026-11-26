package org.certificaciones.funproeibbackend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
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
import java.util.Map;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Prueba de integración real que responde a la pregunta de defensa: "¿Qué
 * impide que un postulante cambie un ID en una solicitud HTTP y descargue
 * documentos de otra persona?". Antes esto era una limitación conocida,
 * documentada en SecurityConfig: cualquier usuario autenticado podía leer o
 * escribir documentos/respuestas de cualquier postulación con solo adivinar
 * el id (ver DocumentoController, RespuestaController y
 * RecursoAuthService/@recursoAuth, que ahora lo resuelven).
 */
@SpringBootTest
@ActiveProfiles("integration")
@Transactional
@DisplayName("Integración: un postulante no puede ver ni escribir documentos/respuestas de otra postulación")
class DocumentoRespuestaAutorizacionIntegrationTest {

    @Autowired private WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired private CiudadRepository ciudadRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private JwtService jwtService;

    private String tokenAdmin;
    private String tokenA;
    private String tokenB;
    private Long idPostulacionA;
    private Long idDocumentoA;
    private Long idReqDocumento;
    private Long idPregunta;

    @TempDir
    static Path carpetaSubidas;

    @DynamicPropertySource
    static void propiedades(DynamicPropertyRegistry registry) {
        registry.add("app.uploads.dir", () -> carpetaSubidas.toString());
    }

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

        Usuario admin = usuarioRepository.findByCorreo("admin@funproeib.org").orElseThrow();
        tokenAdmin = "Bearer " + jwtService.generarToken(admin.getId(), admin.getRol());

        Ciudad ciudad = ciudadRepository.findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase("La Paz", "Bolivia")
                .orElseThrow();
        long sufijo = System.nanoTime();

        Long idUsuarioA = usuarioRepository.save(Usuario.builder()
                .nombre("Postulante").apellidoPaterno("A")
                .correo("autorizacion.a." + sufijo + "@test.com")
                .contrasenaHash("x").ci("7" + (sufijo % 100000000L))
                .rol(RolUsuario.POSTULANTE).fechaRegistro(LocalDate.now())
                .activo(true).emailVerificado(true).identidadVerificada(true)
                .ciudad(ciudad).build()).getId();
        tokenA = "Bearer " + jwtService.generarToken(idUsuarioA, RolUsuario.POSTULANTE);

        Long idUsuarioB = usuarioRepository.save(Usuario.builder()
                .nombre("Postulante").apellidoPaterno("B")
                .correo("autorizacion.b." + sufijo + "@test.com")
                .contrasenaHash("x").ci("6" + (sufijo % 100000000L))
                .rol(RolUsuario.POSTULANTE).fechaRegistro(LocalDate.now())
                .activo(true).emailVerificado(true).identidadVerificada(true)
                .ciudad(ciudad).build()).getId();
        tokenB = "Bearer " + jwtService.generarToken(idUsuarioB, RolUsuario.POSTULANTE);

        String bodyPrograma = mockMvc.perform(post("/api/programas").header("Authorization", tokenAdmin)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Taller autorización " + sufijo, "tipo", "TALLER",
                                "fechaInicio", LocalDate.now().plusDays(10).toString(),
                                "fechaFin", LocalDate.now().plusMonths(1).toString(),
                                "cuposDisponibles", 10))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long idPrograma = ((Number) objectMapper.readValue(bodyPrograma, Map.class).get("id")).longValue();
        mockMvc.perform(patch("/api/programas/{id}/estado", idPrograma)
                .header("Authorization", tokenAdmin).param("estado", "ABIERTO"));

        String bodyReqDoc = mockMvc.perform(post("/api/req-documentos").header("Authorization", tokenAdmin)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idPrograma", idPrograma, "nombreDocumento", "Hoja de vida",
                                "obligatorio", false, "tipoPermitido", "PDF"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        idReqDocumento = ((Number) objectMapper.readValue(bodyReqDoc, Map.class).get("id")).longValue();

        String bodyPregunta = mockMvc.perform(post("/api/preguntas").header("Authorization", tokenAdmin)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idPrograma", idPrograma, "enunciado", "¿Por qué quieres postular?", "orden", 1))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        idPregunta = ((Number) objectMapper.readValue(bodyPregunta, Map.class).get("id")).longValue();

        String bodyPostulacion = mockMvc.perform(post("/api/postulaciones").header("Authorization", tokenA)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("idUsuario", idUsuarioA, "idPrograma", idPrograma))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        idPostulacionA = ((Number) objectMapper.readValue(bodyPostulacion, Map.class).get("id")).longValue();

        // Bytes reales de cabecera PDF: el servicio ahora valida el
        // contenido real del archivo, no solo su extensión.
        MockMultipartFile archivo = new MockMultipartFile("archivo", "cv-a.pdf", "application/pdf", "%PDF-1.4\ncontenido".getBytes());
        String bodyDocumento = mockMvc.perform(multipart("/api/documentos/subir").file(archivo)
                        .header("Authorization", tokenA)
                        .param("idPostulacion", idPostulacionA.toString())
                        .param("idReqDocumento", idReqDocumento.toString()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        idDocumentoA = ((Number) objectMapper.readValue(bodyDocumento, Map.class).get("id")).longValue();
    }

    @Test
    @DisplayName("El dueño de la postulación sí puede ver su propio documento")
    void duenoDelDocumento_puedeDescargarlo() throws Exception {
        mockMvc.perform(get("/api/documentos/{id}/archivo", idDocumentoA).header("Authorization", tokenA))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Otro postulante NO puede descargar un documento adivinando su id")
    void otroPostulante_noPuedeDescargarDocumentoAjeno() throws Exception {
        mockMvc.perform(get("/api/documentos/{id}/archivo", idDocumentoA).header("Authorization", tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Otro postulante NO puede listar los documentos de una postulación ajena")
    void otroPostulante_noPuedeListarDocumentosDePostulacionAjena() throws Exception {
        mockMvc.perform(get("/api/documentos/postulacion/{id}", idPostulacionA).header("Authorization", tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Otro postulante NO puede registrar un documento a nombre de una postulación ajena")
    void otroPostulante_noPuedeRegistrarDocumentoEnPostulacionAjena() throws Exception {
        mockMvc.perform(post("/api/documentos").header("Authorization", tokenB)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idPostulacion", idPostulacionA, "idReqDocumento", idReqDocumento,
                                "rutaArchivo", "https://ejemplo.com/intruso.pdf", "tipo", TipoDocumento.ENLACE.name()))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Otro postulante NO puede guardar una respuesta a nombre de una postulación ajena")
    void otroPostulante_noPuedeGuardarRespuestaEnPostulacionAjena() throws Exception {
        mockMvc.perform(post("/api/respuestas").header("Authorization", tokenB)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idPostulacion", idPostulacionA, "idPregunta", idPregunta, "respuesta", "intruso"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Otro postulante NO puede listar las respuestas de una postulación ajena")
    void otroPostulante_noPuedeListarRespuestasDePostulacionAjena() throws Exception {
        mockMvc.perform(get("/api/respuestas/postulacion/{id}", idPostulacionA).header("Authorization", tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("El admin sí puede ver documentos y respuestas de cualquier postulación")
    void admin_puedeVerDocumentosYRespuestasDeCualquierPostulacion() throws Exception {
        mockMvc.perform(get("/api/documentos/postulacion/{id}", idPostulacionA).header("Authorization", tokenAdmin))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/respuestas/postulacion/{id}", idPostulacionA).header("Authorization", tokenAdmin))
                .andExpect(status().isOk());
    }
}
