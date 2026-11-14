package org.certificaciones.funproeibbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;
import org.certificaciones.funproeibbackend.service.CriterioEvaluacionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("CriterioEvaluacionController")
class CriterioEvaluacionControllerTest {

    private MockMvc mockMvc;
    private CriterioEvaluacionService criterioService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        criterioService = mock(CriterioEvaluacionService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new CriterioEvaluacionController(criterioService)).build();
    }

    private CriterioEvaluacionResponse responseDePrueba() {
        return CriterioEvaluacionResponse.builder().id(1L).orden(1).nombreCriterio("Claridad").activo(true).build();
    }

    @Test
    @DisplayName("GET /api/criterios lista todos")
    void listarTodos_devuelveLista() throws Exception {
        when(criterioService.listarTodos()).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/criterios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("GET /api/criterios/activos lista solo los activos")
    void listarActivos_devuelveLista() throws Exception {
        when(criterioService.listarActivos()).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/criterios/activos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("POST /api/criterios crea y devuelve 201")
    void crear_devuelve201() throws Exception {
        when(criterioService.crear(any())).thenReturn(responseDePrueba());

        CriterioEvaluacionRequest request = new CriterioEvaluacionRequest();
        request.setNombreCriterio("Claridad");

        mockMvc.perform(post("/api/criterios")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombreCriterio").value("Claridad"));
    }

    @Test
    @DisplayName("PUT /api/criterios/{id} actualiza y devuelve 200")
    void actualizar_devuelve200() throws Exception {
        when(criterioService.actualizar(eq(1L), any())).thenReturn(responseDePrueba());

        CriterioEvaluacionRequest request = new CriterioEvaluacionRequest();
        request.setNombreCriterio("Claridad");

        mockMvc.perform(put("/api/criterios/1")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/criterios/{id}/activo cambia el estado activo")
    void cambiarActivo_devuelve200() throws Exception {
        when(criterioService.cambiarActivo(1L, false)).thenReturn(
                CriterioEvaluacionResponse.builder().id(1L).activo(false).build());

        mockMvc.perform(patch("/api/criterios/1/activo").param("activo", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false));
    }
}
