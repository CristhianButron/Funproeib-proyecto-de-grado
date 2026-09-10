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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EvaluacionService - evaluación con los 6 criterios estandarizados")
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
    private List<CriterioEvaluacion> criterios;
    private EvaluacionRequest request;

    @BeforeEach
    void setUp() {
        programa = Programa.builder().id(2L).nombre("Diplomado EIB").build();
        postulante = Usuario.builder().id(1L).nombre("Juan").apellidoPaterno("Mamani").build();
        evaluador = Usuario.builder().id(9L).nombre("Evaluador").apellidoPaterno("Admin").build();
        postulacion = Postulacion.builder().id(5L).programa(programa).usuario(postulante)
                .estado(EstadoPostulacion.PENDIENTE).build();

        // Los 6 criterios estandarizados fijos (ver CriterioEvaluacionDataInitializer)
        criterios = new ArrayList<>();
        int[] puntajes = {8, 7, 9, 6, 10, 5}; // suma = 45
        List<DetalleEvaluacionRequest> detalles = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            long id = 20L + i;
            CriterioEvaluacion c = CriterioEvaluacion.builder().id(id).orden(i + 1)
                    .nombreCriterio("Criterio " + (i + 1)).build();
            criterios.add(c);

            DetalleEvaluacionRequest d = new DetalleEvaluacionRequest();
            d.setIdCriterio(id);
            d.setPuntaje(puntajes[i]);
            detalles.add(d);
        }

        request = new EvaluacionRequest();
        request.setIdPostulacion(5L);
        request.setIdEvaluador(9L);
        request.setObservaciones("Buen perfil");
        request.setDetalles(detalles);
    }

    private void mockCriteriosCompletos() {
        when(criterioRepository.findAllByOrderByOrdenAsc()).thenReturn(criterios);
        for (CriterioEvaluacion c : criterios) {
            when(criterioRepository.findById(c.getId())).thenReturn(Optional.of(c));
        }
    }

    @Test
    @DisplayName("Calcula el puntaje total como suma simple: 8+7+9+6+10+5 = 45/60")
    void evaluar_calculaPuntajeTotal() {
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(evaluacionRepository.existsByPostulacionId(5L)).thenReturn(false);
        mockCriteriosCompletos();
        when(usuarioRepository.findById(9L)).thenReturn(Optional.of(evaluador));
        when(evaluacionRepository.save(any(Evaluacion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(detalleRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        EvaluacionResponse res = service.evaluar(request);

        assertThat(res.getPuntajeTotal()).isEqualByComparingTo("45");
        assertThat(res.getPuntajeMaximo()).isEqualTo(60);
        assertThat(res.getDetalles()).hasSize(6);
    }

    @Test
    @DisplayName("Tras evaluar, la postulación pasa a estado EVALUADA")
    void evaluar_cambiaEstadoAEvaluada() {
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(evaluacionRepository.existsByPostulacionId(5L)).thenReturn(false);
        mockCriteriosCompletos();
        when(usuarioRepository.findById(9L)).thenReturn(Optional.of(evaluador));
        when(evaluacionRepository.save(any(Evaluacion.class))).thenAnswer(inv -> inv.getArgument(0));
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

    @Test
    @DisplayName("Rechaza si falta calificar alguno de los 6 criterios estandarizados")
    void evaluar_faltaCriterio_lanzaExcepcion() {
        request.setDetalles(request.getDetalles().subList(0, 5)); // solo 5 de 6
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(evaluacionRepository.existsByPostulacionId(5L)).thenReturn(false);
        when(criterioRepository.findAllByOrderByOrdenAsc()).thenReturn(criterios);

        assertThatThrownBy(() -> service.evaluar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("6 criterios");
        verify(evaluacionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza si se califica el mismo criterio dos veces")
    void evaluar_criterioDuplicado_lanzaExcepcion() {
        DetalleEvaluacionRequest duplicado = new DetalleEvaluacionRequest();
        duplicado.setIdCriterio(request.getDetalles().get(0).getIdCriterio());
        duplicado.setPuntaje(3);
        List<DetalleEvaluacionRequest> conDuplicado = new ArrayList<>(request.getDetalles().subList(0, 5));
        conDuplicado.add(duplicado);
        request.setDetalles(conDuplicado);

        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(evaluacionRepository.existsByPostulacionId(5L)).thenReturn(false);
        when(criterioRepository.findAllByOrderByOrdenAsc()).thenReturn(criterios);

        assertThatThrownBy(() -> service.evaluar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("más de una vez");
    }
}
