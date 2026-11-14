package org.certificaciones.funproeibbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.dto.DetalleEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.EvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.EvaluacionResponse;
import org.certificaciones.funproeibbackend.service.EvaluacionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("EvaluacionController")
class EvaluacionControllerTest {

    private MockMvc mockMvc;
    private EvaluacionService evaluacionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        evaluacionService = mock(EvaluacionService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new EvaluacionController(evaluacionService)).build();
    }

    @Test
    @DisplayName("POST /api/evaluaciones registra y devuelve 201")
    void evaluar_devuelve201() throws Exception {
        EvaluacionResponse response = EvaluacionResponse.builder()
                .id(1L).idPostulacion(5L).puntajeTotal(new BigDecimal("80.00")).puntajeMaximo(100).build();
        when(evaluacionService.evaluar(any())).thenReturn(response);

        EvaluacionRequest request = new EvaluacionRequest();
        request.setIdPostulacion(5L);
        request.setIdEvaluador(9L);
        DetalleEvaluacionRequest detalle = new DetalleEvaluacionRequest();
        detalle.setIdCriterio(1L);
        detalle.setPuntaje(8);
        request.setDetalles(List.of(detalle));

        mockMvc.perform(post("/api/evaluaciones")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.puntajeTotal").value(80.00));
    }

    @Test
    @DisplayName("GET /api/evaluaciones/postulacion/{id} devuelve la evaluación")
    void obtenerPorPostulacion_devuelve200() throws Exception {
        when(evaluacionService.obtenerPorPostulacion(5L))
                .thenReturn(EvaluacionResponse.builder().id(1L).idPostulacion(5L).build());

        mockMvc.perform(get("/api/evaluaciones/postulacion/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPostulacion").value(5));
    }
}
