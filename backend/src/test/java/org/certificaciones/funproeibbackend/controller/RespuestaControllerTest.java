package org.certificaciones.funproeibbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.dto.RespuestaRequest;
import org.certificaciones.funproeibbackend.dto.RespuestaResponse;
import org.certificaciones.funproeibbackend.service.RespuestaService;
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

@DisplayName("RespuestaController")
class RespuestaControllerTest {

    private MockMvc mockMvc;
    private RespuestaService respuestaService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        respuestaService = mock(RespuestaService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new RespuestaController(respuestaService)).build();
    }

    @Test
    @DisplayName("POST /api/respuestas guarda y devuelve 201")
    void guardar_devuelve201() throws Exception {
        when(respuestaService.guardar(any())).thenReturn(
                RespuestaResponse.builder().id(1L).idPregunta(3L).respuesta("Porque sí").build());

        RespuestaRequest request = new RespuestaRequest();
        request.setIdPostulacion(5L);
        request.setIdPregunta(3L);
        request.setRespuesta("Porque sí");

        mockMvc.perform(post("/api/respuestas")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.respuesta").value("Porque sí"));
    }

    @Test
    @DisplayName("GET /api/respuestas/postulacion/{id} lista las respuestas")
    void listarPorPostulacion_devuelveLista() throws Exception {
        when(respuestaService.listarPorPostulacion(5L)).thenReturn(
                List.of(RespuestaResponse.builder().id(1L).build()));

        mockMvc.perform(get("/api/respuestas/postulacion/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
