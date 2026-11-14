package org.certificaciones.funproeibbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.dto.ReqDocumentoRequest;
import org.certificaciones.funproeibbackend.dto.ReqDocumentoResponse;
import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import org.certificaciones.funproeibbackend.service.ReqDocumentoService;
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

@DisplayName("ReqDocumentoController")
class ReqDocumentoControllerTest {

    private MockMvc mockMvc;
    private ReqDocumentoService reqDocumentoService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        reqDocumentoService = mock(ReqDocumentoService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ReqDocumentoController(reqDocumentoService)).build();
    }

    @Test
    @DisplayName("POST /api/req-documentos crea y devuelve 201")
    void crear_devuelve201() throws Exception {
        when(reqDocumentoService.crear(any())).thenReturn(
                ReqDocumentoResponse.builder().id(1L).idPrograma(2L).nombreDocumento("CI").build());

        ReqDocumentoRequest request = new ReqDocumentoRequest();
        request.setIdPrograma(2L);
        request.setNombreDocumento("CI");
        request.setTipoPermitido(TipoDocumento.PDF);

        mockMvc.perform(post("/api/req-documentos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombreDocumento").value("CI"));
    }

    @Test
    @DisplayName("GET /api/req-documentos/programa/{id} lista los requisitos")
    void listarPorPrograma_devuelveLista() throws Exception {
        when(reqDocumentoService.listarPorPrograma(2L)).thenReturn(
                List.of(ReqDocumentoResponse.builder().id(1L).build()));

        mockMvc.perform(get("/api/req-documentos/programa/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
