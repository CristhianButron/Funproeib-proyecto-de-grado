package org.certificaciones.funproeibbackend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Prueba de integración real, SIN @Transactional de prueba a propósito: cada
 * petición concurrente necesita su propia transacción/conexión real para que
 * el escenario de carrera sea genuino (con @Transactional de JUnit, los dos
 * hilos compartirían la misma conexión bloqueada en el hilo de la prueba).
 * Limpia los datos que crea a mano en @AfterEach en vez de depender de rollback.
 *
 * Cubre la observación de la revisión de tutoría: "¿Cómo se garantiza que dos
 * postulaciones simultáneas no excedan el cupo?" (ver
 * ProgramaRepository.findByIdParaActualizar y
 * PostulacionServiceImpl.crear, que ahora bloquean la fila del programa con
 * SELECT ... FOR UPDATE mientras dura la validación + el insert).
 */
@SpringBootTest
@ActiveProfiles("integration")
@DisplayName("Integración: dos postulaciones simultáneas no exceden el cupo del programa")
class PostulacionConcurrenciaIntegrationTest {

    @Autowired private WebApplicationContext webApplicationContext;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired private CiudadRepository ciudadRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProgramaRepository programaRepository;
    @Autowired private PostulacionRepository postulacionRepository;
    @Autowired private JwtService jwtService;

    private String tokenAdmin;
    private Long idPrograma;
    private Long idUsuarioA;
    private Long idUsuarioB;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
        Usuario admin = usuarioRepository.findByCorreo("admin@funproeib.org").orElseThrow();
        tokenAdmin = "Bearer " + jwtService.generarToken(admin.getId(), admin.getRol());

        Ciudad ciudad = ciudadRepository.findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase("La Paz", "Bolivia")
                .orElseThrow();
        long sufijo = System.nanoTime();

        idUsuarioA = usuarioRepository.save(Usuario.builder()
                .nombre("Concurrencia").apellidoPaterno("A")
                .correo("concurrencia.a." + sufijo + "@test.com")
                .contrasenaHash("x").ci("9" + (sufijo % 100000000L))
                .rol(RolUsuario.POSTULANTE).fechaRegistro(LocalDate.now())
                .activo(true).emailVerificado(true).identidadVerificada(true)
                .ciudad(ciudad).build()).getId();

        idUsuarioB = usuarioRepository.save(Usuario.builder()
                .nombre("Concurrencia").apellidoPaterno("B")
                .correo("concurrencia.b." + sufijo + "@test.com")
                .contrasenaHash("x").ci("8" + (sufijo % 100000000L))
                .rol(RolUsuario.POSTULANTE).fechaRegistro(LocalDate.now())
                .activo(true).emailVerificado(true).identidadVerificada(true)
                .ciudad(ciudad).build()).getId();

        idPrograma = programaRepository.save(Programa.builder()
                .nombre("Taller de concurrencia " + sufijo).tipo(TipoPrograma.TALLER)
                .fechaInicio(LocalDate.now().plusDays(10)).fechaFin(LocalDate.now().plusMonths(1))
                .cuposDisponibles(1).estado(EstadoPrograma.ABIERTO).build()).getId();
    }

    @AfterEach
    void limpiar() {
        postulacionRepository.deleteAll(postulacionRepository.findByProgramaId(idPrograma));
        programaRepository.deleteById(idPrograma);
        usuarioRepository.deleteById(idUsuarioA);
        usuarioRepository.deleteById(idUsuarioB);
    }

    @Test
    @DisplayName("Con 1 solo cupo, de 2 postulaciones disparadas al mismo tiempo exactamente una tiene éxito")
    void dosPostulacionesSimultaneas_soloUnaSuperaElCupoDeUno() throws Exception {
        ExecutorService ejecutor = Executors.newFixedThreadPool(2);
        CountDownLatch salida = new CountDownLatch(1);
        AtomicInteger exitos = new AtomicInteger(0);
        AtomicInteger rechazosPorCupo = new AtomicInteger(0);

        List<Long> usuarios = List.of(idUsuarioA, idUsuarioB);
        var tareas = usuarios.stream().<java.util.concurrent.Future<?>>map(idUsuario -> ejecutor.submit(() -> {
            try {
                salida.await();
                MockHttpServletResponse respuesta = mockMvc.perform(post("/api/postulaciones")
                                .header("Authorization", tokenAdmin)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "idUsuario", idUsuario, "idPrograma", idPrograma))))
                        .andReturn().getResponse();
                if (respuesta.getStatus() == 201) {
                    exitos.incrementAndGet();
                } else if (respuesta.getStatus() == 422 && respuesta.getContentAsString().contains("cupos")) {
                    rechazosPorCupo.incrementAndGet();
                }
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        })).toList();

        salida.countDown();
        for (var tarea : tareas) {
            tarea.get(10, TimeUnit.SECONDS);
        }
        ejecutor.shutdown();

        assertThat(exitos.get()).isEqualTo(1);
        assertThat(rechazosPorCupo.get()).isEqualTo(1);

        List<Postulacion> postulaciones = postulacionRepository.findByProgramaId(idPrograma);
        assertThat(postulaciones).hasSize(1);
    }
}
