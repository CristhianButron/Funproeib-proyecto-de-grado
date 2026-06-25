package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.DetalleEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.EvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.EvaluacionResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.model.*;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.repository.*;
import org.certificaciones.funproeibbackend.service.impl.EvaluacionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EvaluacionService - evaluación con criterios y puntaje ponderado")
class EvaluacionServiceImplTest {

    @Mock private EvaluacionRepository evaluacionRepository;
    @Mock private DetalleEvaluacionRepository detalleRepository;
    @Mock private PostulacionRepository postulacionRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private CriterioEvaluacionRepository criterioRepository;

    @InjectMocks private EvaluacionServiceImpl service;

    private Programa programa;
    private Usuario postulante;
    private Usuario evaluador;
    private Postulacion postulacion;
    private CriterioEvaluacion criterio1;
    private CriterioEvaluacion criterio2;
    private EvaluacionRequest request;

    @BeforeEach
    void setUp() {
        programa = Programa.builder().id(2L).nombre("Diplomado EIB").build();
        postulante = Usuario.builder().id(1L).nombreCompleto("Juan Mamani").build();
        evaluador = Usuario.builder().id(9L).nombreCompleto("Evaluador Admin").build();
        postulacion = Postulacion.builder().id(5L).programa(programa).usuario(postulante)
                .estado(EstadoPostulacion.PENDIENTE).build();

        // Pesos 60 y 40 (suman 100)
        criterio1 = CriterioEvaluacion.builder().id(20L).programa(programa)
                .nombreCriterio("Experiencia").peso(new BigDecimal("60")).build();
        criterio2 = CriterioEvaluacion.builder().id(21L).programa(programa)
                .nombreCriterio("Formación").peso(new BigDecimal("40")).build();

        DetalleEvaluacionRequest d1 = new DetalleEvaluacionRequest();
        d1.setIdCriterio(20L); d1.setPuntaje(5);
        DetalleEvaluacionRequest d2 = new DetalleEvaluacionRequest();
        d2.setIdCriterio(21L); d2.setPuntaje(3);

        request = new EvaluacionRequest();
        request.setIdPostulacion(5L);
        request.setIdEvaluador(9L);
        request.setObservaciones("Buen perfil");
        request.setDetalles(List.of(d1, d2));
    }

    @Test
    @DisplayName("Calcula el puntaje ponderado correctamente: (5*60 + 3*40)/100 = 4.20")
    void evaluar_calculaPuntajePonderado() {
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(evaluacionRepository.existsByPostulacionId(5L)).thenReturn(false);
        when(usuarioRepository.findById(9L)).thenReturn(Optional.of(evaluador));
        when(evaluacionRepository.save(any(Evaluacion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(criterioRepository.findById(20L)).thenReturn(Optional.of(criterio1));
        when(criterioRepository.findById(21L)).thenReturn(Optional.of(criterio2));
        when(detalleRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        EvaluacionResponse res = service.evaluar(request);

        assertThat(res.getPuntajeTotal()).isEqualByComparingTo("4.20");
        assertThat(res.getDetalles()).hasSize(2);
    }

    @Test
    @DisplayName("Tras evaluar, la postulación pasa a estado EVALUADA")
    void evaluar_cambiaEstadoAEvaluada() {
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(evaluacionRepository.existsByPostulacionId(5L)).thenReturn(false);
        when(usuarioRepository.findById(9L)).thenReturn(Optional.of(evaluador));
        when(evaluacionRepository.save(any(Evaluacion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(criterioRepository.findById(20L)).thenReturn(Optional.of(criterio1));
        when(criterioRepository.findById(21L)).thenReturn(Optional.of(criterio2));
        when(detalleRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        service.evaluar(request);

        ArgumentCaptor<Postulacion> captor = ArgumentCaptor.forClass(Postulacion.class);
        verify(postulacionRepository).save(captor.capture());
        assertThat(captor.getValue().getEstado()).isEqualTo(EstadoPostulacion.EVALUADA);
    }

    @Test
    @DisplayName("Rechaza evaluar una postulación que no está PENDIENTE")
    void evaluar_postulacionNoPendiente_lanzaExcepcion() {
        postulacion.setEstado(EstadoPostulacion.INCOMPLETA);
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));

        assertThatThrownBy(() -> service.evaluar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDIENTE");
        verify(evaluacionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza si la postulación ya fue evaluada")
    void evaluar_yaEvaluada_lanzaExcepcion() {
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(evaluacionRepository.existsByPostulacionId(5L)).thenReturn(true);

        assertThatThrownBy(() -> service.evaluar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya tiene una evaluación");
    }
}
