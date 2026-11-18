package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.PostulacionResponse;
import org.certificaciones.funproeibbackend.model.enums.EstadoAprovechamiento;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.service.PostulacionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cubre los endpoints de PostulacionController que no pasan por
 * PostulacionAprovechamientoIntegrationTest (crear, cambiarEstado y
 * aprovechamiento ya están probados ahí contra una base real): las
 * consultas de listado.
 */
@DisplayName("PostulacionController (endpoints no cubiertos por la prueba de integración)")
class PostulacionControllerTest {

    private MockMvc mockMvc;
    private PostulacionService postulacionService;

    @BeforeEach
    void setUp() {
        postulacionService = mock(PostulacionService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new PostulacionController(postulacionService)).build();
    }

    private PostulacionResponse responseDePrueba() {
        return PostulacionResponse.builder().id(1L).idUsuario(2L).idPrograma(3L)
                .estado(EstadoPostulacion.PENDIENTE).estadoAprovechamiento(EstadoAprovechamiento.PENDIENTE).build();
    }

    @Test
    @DisplayName("GET /api/postulaciones/{id} devuelve la postulación")
    void obtenerPorId_devuelve200() throws Exception {
        when(postulacionService.obtenerPorId(1L)).thenReturn(responseDePrueba());

        mockMvc.perform(get("/api/postulaciones/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/postulaciones/programa/{id} lista por programa")
    void listarPorPrograma_devuelveLista() throws Exception {
        when(postulacionService.listarPorPrograma(3L)).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/postulaciones/programa/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("GET /api/postulaciones/usuario/{id} lista por usuario")
    void listarPorUsuario_devuelveLista() throws Exception {
        when(postulacionService.listarPorUsuario(2L)).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/postulaciones/usuario/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("GET /api/postulaciones/estado/{estado} lista por estado")
    void listarPorEstado_devuelveLista() throws Exception {
        when(postulacionService.listarPorEstado(EstadoPostulacion.PENDIENTE)).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/postulaciones/estado/PENDIENTE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
