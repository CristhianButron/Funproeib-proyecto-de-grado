package org.certificaciones.funproeibbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.dto.PreguntaRequest;
import org.certificaciones.funproeibbackend.dto.PreguntaResponse;
import org.certificaciones.funproeibbackend.service.PreguntaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("PreguntaController")
class PreguntaControllerTest {

    private MockMvc mockMvc;
    private PreguntaService preguntaService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        preguntaService = mock(PreguntaService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new PreguntaController(preguntaService)).build();
    }

    @Test
    @DisplayName("POST /api/preguntas crea y devuelve 201")
    void crear_devuelve201() throws Exception {
        when(preguntaService.crear(any())).thenReturn(
                PreguntaResponse.builder().id(1L).idPrograma(2L).enunciado("¿Por qué te interesa?").orden(1).build());

        PreguntaRequest request = new PreguntaRequest();
        request.setIdPrograma(2L);
        request.setEnunciado("¿Por qué te interesa?");

        mockMvc.perform(post("/api/preguntas")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/preguntas/programa/{id} lista las preguntas")
    void listarPorPrograma_devuelveLista() throws Exception {
        when(preguntaService.listarPorPrograma(2L)).thenReturn(
                List.of(PreguntaResponse.builder().id(1L).idPrograma(2L).build()));

        mockMvc.perform(get("/api/preguntas/programa/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("DELETE /api/preguntas/{id} elimina y devuelve 204")
    void eliminar_devuelve204() throws Exception {
        mockMvc.perform(delete("/api/preguntas/1"))
                .andExpect(status().isNoContent());

        verify(preguntaService).eliminar(1L);
    }
}
