package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.CiudadResponse;
import org.certificaciones.funproeibbackend.dto.PaisResponse;
import org.certificaciones.funproeibbackend.service.UbicacionService;
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

@DisplayName("UbicacionController")
class UbicacionControllerTest {

    private MockMvc mockMvc;
    private UbicacionService ubicacionService;

    @BeforeEach
    void setUp() {
        ubicacionService = mock(UbicacionService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new UbicacionController(ubicacionService)).build();
    }

    @Test
    @DisplayName("GET /api/ubicaciones/paises lista los países")
    void listarPaises_devuelveLista() throws Exception {
        when(ubicacionService.listarPaises()).thenReturn(List.of(PaisResponse.builder().id(1L).nombre("Bolivia").build()));

        mockMvc.perform(get("/api/ubicaciones/paises"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Bolivia"));
    }

    @Test
    @DisplayName("GET /api/ubicaciones/paises/{id}/ciudades lista las ciudades")
    void listarCiudades_devuelveLista() throws Exception {
        when(ubicacionService.listarCiudadesPorPais(1L)).thenReturn(
                List.of(CiudadResponse.builder().id(10L).nombre("La Paz").idPais(1L).build()));

        mockMvc.perform(get("/api/ubicaciones/paises/1/ciudades"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("La Paz"));
    }
}
