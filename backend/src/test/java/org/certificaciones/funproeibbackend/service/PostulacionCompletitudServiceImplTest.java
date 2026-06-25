package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.model.*;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import org.certificaciones.funproeibbackend.repository.*;
import org.certificaciones.funproeibbackend.service.impl.PostulacionCompletitudServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostulacionCompletitud - regla INCOMPLETA -> PENDIENTE")
class PostulacionCompletitudServiceImplTest {

    @Mock private PostulacionRepository postulacionRepository;
    @Mock private ReqDocumentoRepository reqDocumentoRepository;
    @Mock private DocumentoRepository documentoRepository;
    @Mock private PreguntaPostulacionRepository preguntaRepository;
    @Mock private RespuestaPostulacionRepository respuestaRepository;

    @InjectMocks private PostulacionCompletitudServiceImpl service;

    private Programa programa;
    private Postulacion postulacion;
    private ReqDocumento reqObligatorio;
    private PreguntaPostulacion pregunta;

    @BeforeEach
    void setUp() {
        programa = Programa.builder().id(2L).build();
        postulacion = Postulacion.builder().id(5L).programa(programa)
                .estado(EstadoPostulacion.INCOMPLETA).build();
        reqObligatorio = ReqDocumento.builder().id(7L).programa(programa)
                .obligatorio(true).tipoPermitido(TipoDocumento.PDF).build();
        pregunta = PreguntaPostulacion.builder().id(30L).programa(programa)
                .enunciado("¿Experiencia en voluntariado?").build();
    }

    @Test
    @DisplayName("Pasa a PENDIENTE cuando documentos y preguntas están completos")
    void revisar_todoCompleto_pasaAPendiente() {
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findByProgramaId(2L)).thenReturn(List.of(reqObligatorio));
        Documento doc = Documento.builder().id(11L).reqDocumento(reqObligatorio).build();
        when(documentoRepository.findByPostulacionId(5L)).thenReturn(List.of(doc));
        when(preguntaRepository.findByProgramaIdOrderByOrdenAsc(2L)).thenReturn(List.of(pregunta));
        RespuestaPostulacion resp = RespuestaPostulacion.builder().id(40L).pregunta(pregunta)
                .respuesta("Hice voluntariado 3 veces...").build();
        when(respuestaRepository.findByPostulacionId(5L)).thenReturn(List.of(resp));

        service.revisar(5L);

        ArgumentCaptor<Postulacion> captor = ArgumentCaptor.forClass(Postulacion.class);
        verify(postulacionRepository).save(captor.capture());
        assertThat(captor.getValue().getEstado()).isEqualTo(EstadoPostulacion.PENDIENTE);
    }

    @Test
    @DisplayName("NO pasa a PENDIENTE si falta responder una pregunta")
    void revisar_faltaRespuesta_siguenIncompleta() {
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findByProgramaId(2L)).thenReturn(List.of(reqObligatorio));
        Documento doc = Documento.builder().id(11L).reqDocumento(reqObligatorio).build();
        when(documentoRepository.findByPostulacionId(5L)).thenReturn(List.of(doc));
        when(preguntaRepository.findByProgramaIdOrderByOrdenAsc(2L)).thenReturn(List.of(pregunta));
        when(respuestaRepository.findByPostulacionId(5L)).thenReturn(List.of()); // sin respuestas

        service.revisar(5L);

        verify(postulacionRepository, never()).save(any(Postulacion.class));
        assertThat(postulacion.getEstado()).isEqualTo(EstadoPostulacion.INCOMPLETA);
    }

    @Test
    @DisplayName("No hace nada si la postulación ya no está INCOMPLETA")
    void revisar_noIncompleta_noHaceNada() {
        postulacion.setEstado(EstadoPostulacion.EVALUADA);
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));

        service.revisar(5L);

        verify(postulacionRepository, never()).save(any(Postulacion.class));
    }
}
