package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.BeneficiarioReporteResponse;
import org.certificaciones.funproeibbackend.service.ReporteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("ReporteController")
class ReporteControllerTest {

    private MockMvc mockMvc;
    private ReporteService reporteService;

    @BeforeEach
    void setUp() {
        reporteService = mock(ReporteService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ReporteController(reporteService)).build();
    }

    @Test
    @DisplayName("GET /api/reportes/beneficiarios devuelve la lista filtrada")
    void listarBeneficiarios_devuelveLista() throws Exception {
        when(reporteService.listarBeneficiarios(any())).thenReturn(
                List.of(BeneficiarioReporteResponse.builder().idPostulacion(1L).nombreCompleto("Ana Quispe").build()));

        mockMvc.perform(get("/api/reportes/beneficiarios").param("idPrograma", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nombreCompleto").value("Ana Quispe"));
    }
}
