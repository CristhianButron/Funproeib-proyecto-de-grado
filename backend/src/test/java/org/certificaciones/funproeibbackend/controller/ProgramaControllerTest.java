package org.certificaciones.funproeibbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.certificaciones.funproeibbackend.dto.ProgramaRequest;
import org.certificaciones.funproeibbackend.dto.ProgramaResponse;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import org.certificaciones.funproeibbackend.service.ProgramaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas unitarias del controlador en aislamiento: MockMvc "standalone"
 * (sin levantar el contexto de Spring) sobre el controlador con el servicio
 * mockeado. Solo verifican el cableado HTTP (ruta, status, body), la lógica
 * de negocio ya la cubren las pruebas de ProgramaServiceImplTest.
 */
@DisplayName("ProgramaController")
class ProgramaControllerTest {

    private MockMvc mockMvc;
    private ProgramaService programaService;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        programaService = mock(ProgramaService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ProgramaController(programaService)).build();
    }

    private ProgramaRequest requestValido() {
        ProgramaRequest r = new ProgramaRequest();
        r.setNombre("Diplomado de prueba");
        r.setTipo(TipoPrograma.DIPLOMADO);
        r.setFechaInicio(LocalDate.now());
        r.setFechaFin(LocalDate.now().plusMonths(2));
        r.setCuposDisponibles(10);
        return r;
    }

    private ProgramaResponse responseDePrueba() {
        return ProgramaResponse.builder().id(1L).nombre("Diplomado de prueba")
                .tipo(TipoPrograma.DIPLOMADO).estado(EstadoPrograma.BORRADOR).build();
    }

    @Test
    @DisplayName("POST /api/programas crea y devuelve 201")
    void crear_devuelve201() throws Exception {
        when(programaService.crear(any())).thenReturn(responseDePrueba());

        mockMvc.perform(post("/api/programas")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/programas/{id} devuelve el programa")
    void obtenerPorId_devuelve200() throws Exception {
        when(programaService.obtenerPorId(1L)).thenReturn(responseDePrueba());

        mockMvc.perform(get("/api/programas/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Diplomado de prueba"));
    }

    @Test
    @DisplayName("GET /api/programas lista todos")
    void listarTodos_devuelveLista() throws Exception {
        when(programaService.listarTodos()).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/programas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("PUT /api/programas/{id} actualiza y devuelve 200")
    void actualizar_devuelve200() throws Exception {
        when(programaService.actualizar(eq(1L), any())).thenReturn(responseDePrueba());

        mockMvc.perform(put("/api/programas/1")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/programas/{id}/estado cambia el estado")
    void cambiarEstado_devuelve200() throws Exception {
        when(programaService.cambiarEstado(1L, "ABIERTO"))
                .thenReturn(ProgramaResponse.builder().id(1L).estado(EstadoPrograma.ABIERTO).build());

        mockMvc.perform(patch("/api/programas/1/estado").param("estado", "ABIERTO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("ABIERTO"));
    }
}
