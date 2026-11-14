package org.certificaciones.funproeibbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.DocumentoRequest;
import org.certificaciones.funproeibbackend.dto.DocumentoResponse;
import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import org.certificaciones.funproeibbackend.service.DocumentoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("DocumentoController")
class DocumentoControllerTest {

    private MockMvc mockMvc;
    private DocumentoService documentoService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        documentoService = mock(DocumentoService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new DocumentoController(documentoService)).build();
    }

    private DocumentoResponse responseDePrueba() {
        return DocumentoResponse.builder().id(1L).idPostulacion(5L).tipo(TipoDocumento.ENLACE).verificado(false).build();
    }

    @Test
    @DisplayName("POST /api/documentos registra y devuelve 201")
    void registrar_devuelve201() throws Exception {
        when(documentoService.registrar(any())).thenReturn(responseDePrueba());
        DocumentoRequest request = new DocumentoRequest();
        request.setIdPostulacion(5L);
        request.setIdReqDocumento(2L);
        request.setRutaArchivo("https://ejemplo.com/doc.pdf");
        request.setTipo(TipoDocumento.ENLACE);

        mockMvc.perform(post("/api/documentos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("POST /api/documentos/subir sube un archivo multipart y devuelve 201")
    void subir_devuelve201() throws Exception {
        when(documentoService.subirArchivo(eq(5L), eq(2L), any())).thenReturn(responseDePrueba());
        MockMultipartFile archivo = new MockMultipartFile("archivo", "cv.pdf", "application/pdf", "contenido".getBytes());

        mockMvc.perform(multipart("/api/documentos/subir")
                        .file(archivo)
                        .param("idPostulacion", "5")
                        .param("idReqDocumento", "2"))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/documentos/{id}/archivo descarga el recurso")
    void descargar_devuelve200() throws Exception {
        ArchivoDescargable archivo = ArchivoDescargable.builder()
                .recurso(new ByteArrayResource("hola".getBytes()))
                .contentType("application/pdf")
                .nombreArchivo("cv.pdf")
                .build();
        when(documentoService.descargar(1L)).thenReturn(archivo);

        mockMvc.perform(get("/api/documentos/1/archivo"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/documentos/postulacion/{id} lista los documentos")
    void listarPorPostulacion_devuelveLista() throws Exception {
        when(documentoService.listarPorPostulacion(5L)).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/documentos/postulacion/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("PATCH /api/documentos/{id}/verificar marca como verificado")
    void verificar_devuelve200() throws Exception {
        when(documentoService.verificar(1L)).thenReturn(
                DocumentoResponse.builder().id(1L).verificado(true).build());

        mockMvc.perform(patch("/api/documentos/1/verificar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificado").value(true));
    }

    @Test
    @DisplayName("PATCH /api/documentos/postulacion/{id}/verificar-todos devuelve 204")
    void verificarTodos_devuelve204() throws Exception {
        mockMvc.perform(patch("/api/documentos/postulacion/5/verificar-todos"))
                .andExpect(status().isNoContent());

        verify(documentoService).verificarTodosDePostulacion(5L);
    }
}
