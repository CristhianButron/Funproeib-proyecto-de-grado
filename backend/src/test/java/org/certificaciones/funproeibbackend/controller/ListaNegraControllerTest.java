package org.certificaciones.funproeibbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.dto.ListaNegraRequest;
import org.certificaciones.funproeibbackend.dto.ListaNegraResponse;
import org.certificaciones.funproeibbackend.model.enums.MotivoListaNegra;
import org.certificaciones.funproeibbackend.service.ListaNegraService;
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

@DisplayName("ListaNegraController")
class ListaNegraControllerTest {

    private MockMvc mockMvc;
    private ListaNegraService listaNegraService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        listaNegraService = mock(ListaNegraService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ListaNegraController(listaNegraService)).build();
    }

    private ListaNegraResponse responseDePrueba() {
        return ListaNegraResponse.builder().id(1L).ciPostulante("12345678")
                .motivo(MotivoListaNegra.ABANDONO).activo(true).build();
    }

    @Test
    @DisplayName("POST /api/lista-negra agrega y devuelve 201")
    void agregar_devuelve201() throws Exception {
        when(listaNegraService.agregar(any())).thenReturn(responseDePrueba());

        ListaNegraRequest request = new ListaNegraRequest();
        request.setCiPostulante("12345678");
        request.setMotivo(MotivoListaNegra.ABANDONO);
        request.setIdRegistradoPor(1L);

        mockMvc.perform(post("/api/lista-negra")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ciPostulante").value("12345678"));
    }

    @Test
    @DisplayName("GET /api/lista-negra lista los activos")
    void listarActivos_devuelveLista() throws Exception {
        when(listaNegraService.listarActivos()).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/lista-negra"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("GET /api/lista-negra/verificar/{ci} devuelve true o false")
    void verificar_devuelveBooleano() throws Exception {
        when(listaNegraService.estaEnListaNegra("12345678")).thenReturn(true);

        mockMvc.perform(get("/api/lista-negra/verificar/12345678"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    @DisplayName("PATCH /api/lista-negra/{id}/desactivar desactiva el registro")
    void desactivar_devuelve200() throws Exception {
        when(listaNegraService.desactivar(1L)).thenReturn(
                ListaNegraResponse.builder().id(1L).activo(false).build());

        mockMvc.perform(patch("/api/lista-negra/1/desactivar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false));
    }
}
