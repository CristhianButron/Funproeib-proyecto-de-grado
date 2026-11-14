package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.RespuestaRequest;
import org.certificaciones.funproeibbackend.dto.RespuestaResponse;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.PreguntaPostulacion;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.RespuestaPostulacion;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.PreguntaPostulacionRepository;
import org.certificaciones.funproeibbackend.repository.RespuestaPostulacionRepository;
import org.certificaciones.funproeibbackend.service.impl.RespuestaServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RespuestaService - guardar (upsert) y listar respuestas")
class RespuestaServiceImplTest {

    @Mock private RespuestaPostulacionRepository respuestaRepository;
    @Mock private PostulacionRepository postulacionRepository;
    @Mock private PreguntaPostulacionRepository preguntaRepository;
    @Mock private PostulacionCompletitudService completitudService;

    private RespuestaServiceImpl service;

    private Postulacion postulacion;
    private PreguntaPostulacion pregunta;

    @BeforeEach
    void setUp() {
        service = new RespuestaServiceImpl(respuestaRepository, postulacionRepository, preguntaRepository, completitudService);
        postulacion = Postulacion.builder().id(5L).build();
        pregunta = PreguntaPostulacion.builder().id(3L).enunciado("¿Por qué?").build();
    }

    @Test
    @DisplayName("Guardar crea la respuesta si no existía y revisa la completitud")
    void guardar_noExistia_creaYRevisaCompletitud() {
        RespuestaRequest request = new RespuestaRequest();
        request.setIdPostulacion(5L);
        request.setIdPregunta(3L);
        request.setRespuesta("Porque sí");

        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(preguntaRepository.findById(3L)).thenReturn(Optional.of(pregunta));
        when(respuestaRepository.findByPostulacionIdAndPreguntaId(5L, 3L)).thenReturn(Optional.empty());
        when(respuestaRepository.save(any(RespuestaPostulacion.class))).thenAnswer(inv -> inv.getArgument(0));

        RespuestaResponse res = service.guardar(request);

        assertThat(res.getRespuesta()).isEqualTo("Porque sí");
        verify(completitudService).revisar(5L);
    }

    @Test
    @DisplayName("Guardar actualiza la respuesta existente en vez de duplicarla")
    void guardar_yaExistia_actualiza() {
        RespuestaPostulacion existente = RespuestaPostulacion.builder().id(10L)
                .postulacion(postulacion).pregunta(pregunta).respuesta("vieja").build();
        RespuestaRequest request = new RespuestaRequest();
        request.setIdPostulacion(5L);
        request.setIdPregunta(3L);
        request.setRespuesta("nueva");

        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(preguntaRepository.findById(3L)).thenReturn(Optional.of(pregunta));
        when(respuestaRepository.findByPostulacionIdAndPreguntaId(5L, 3L)).thenReturn(Optional.of(existente));
        when(respuestaRepository.save(any(RespuestaPostulacion.class))).thenAnswer(inv -> inv.getArgument(0));

        RespuestaResponse res = service.guardar(request);

        assertThat(res.getId()).isEqualTo(10L);
        assertThat(res.getRespuesta()).isEqualTo("nueva");
    }

    @Test
    @DisplayName("Rechaza guardar si la postulación no existe")
    void guardar_postulacionInexistente_lanzaExcepcion() {
        RespuestaRequest request = new RespuestaRequest();
        request.setIdPostulacion(99L);
        when(postulacionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.guardar(request)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("listarPorPostulacion devuelve las respuestas mapeadas")
    void listarPorPostulacion_devuelveLista() {
        RespuestaPostulacion r = RespuestaPostulacion.builder().id(1L).postulacion(postulacion).pregunta(pregunta).respuesta("x").build();
        when(respuestaRepository.findByPostulacionId(5L)).thenReturn(java.util.List.of(r));

        assertThat(service.listarPorPostulacion(5L)).hasSize(1);
    }
}
