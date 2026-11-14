package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.PreguntaRequest;
import org.certificaciones.funproeibbackend.dto.PreguntaResponse;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.PreguntaPostulacion;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.repository.PreguntaPostulacionRepository;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.service.impl.PreguntaServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PreguntaService - crear, listar y eliminar preguntas de postulación")
class PreguntaServiceImplTest {

    @Mock private PreguntaPostulacionRepository preguntaRepository;
    @Mock private ProgramaRepository programaRepository;

    private PreguntaServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PreguntaServiceImpl(preguntaRepository, programaRepository);
    }

    @Test
    @DisplayName("Crear asigna el orden indicado y queda ligada al programa")
    void crear_conOrden_creaPregunta() {
        Programa programa = Programa.builder().id(2L).nombre("Diplomado").build();
        PreguntaRequest request = new PreguntaRequest();
        request.setIdPrograma(2L);
        request.setEnunciado("¿Por qué te interesa?");
        request.setOrden(3);

        when(programaRepository.findById(2L)).thenReturn(Optional.of(programa));
        when(preguntaRepository.save(any(PreguntaPostulacion.class))).thenAnswer(inv -> inv.getArgument(0));

        PreguntaResponse res = service.crear(request);

        assertThat(res.getOrden()).isEqualTo(3);
        assertThat(res.getIdPrograma()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Crear sin orden especificado usa 1 por defecto")
    void crear_sinOrden_usaUnoPorDefecto() {
        Programa programa = Programa.builder().id(2L).build();
        PreguntaRequest request = new PreguntaRequest();
        request.setIdPrograma(2L);
        request.setEnunciado("¿Por qué te interesa?");
        request.setOrden(null);

        when(programaRepository.findById(2L)).thenReturn(Optional.of(programa));
        when(preguntaRepository.save(any(PreguntaPostulacion.class))).thenAnswer(inv -> inv.getArgument(0));

        PreguntaResponse res = service.crear(request);

        assertThat(res.getOrden()).isEqualTo(1);
    }

    @Test
    @DisplayName("Rechaza crear si el programa no existe")
    void crear_programaInexistente_lanzaExcepcion() {
        PreguntaRequest request = new PreguntaRequest();
        request.setIdPrograma(99L);
        when(programaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.crear(request)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("listarPorPrograma devuelve las preguntas ordenadas")
    void listarPorPrograma_devuelveLista() {
        Programa programa = Programa.builder().id(2L).build();
        PreguntaPostulacion p = PreguntaPostulacion.builder().id(1L).programa(programa).enunciado("x").orden(1).build();
        when(preguntaRepository.findByProgramaIdOrderByOrdenAsc(2L)).thenReturn(List.of(p));

        assertThat(service.listarPorPrograma(2L)).hasSize(1);
    }

    @Test
    @DisplayName("Eliminar borra la pregunta si existe")
    void eliminar_existente_borra() {
        when(preguntaRepository.existsById(1L)).thenReturn(true);

        service.eliminar(1L);

        verify(preguntaRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Rechaza eliminar una pregunta que no existe")
    void eliminar_inexistente_lanzaExcepcion() {
        when(preguntaRepository.existsById(1L)).thenReturn(false);

        assertThatThrownBy(() -> service.eliminar(1L)).isInstanceOf(ResourceNotFoundException.class);
        verify(preguntaRepository, never()).deleteById(any());
    }
}
