package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.DetalleEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.DetalleEvaluacionResponse;
import org.certificaciones.funproeibbackend.dto.EvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.EvaluacionResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.CriterioEvaluacion;
import org.certificaciones.funproeibbackend.model.DetalleEvaluacion;
import org.certificaciones.funproeibbackend.model.Evaluacion;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.repository.CriterioEvaluacionRepository;
import org.certificaciones.funproeibbackend.repository.DetalleEvaluacionRepository;
import org.certificaciones.funproeibbackend.repository.EvaluacionRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.EvaluacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EvaluacionServiceImpl implements EvaluacionService {

    private final EvaluacionRepository evaluacionRepository;
    private final DetalleEvaluacionRepository detalleRepository;
    private final PostulacionRepository postulacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final CriterioEvaluacionRepository criterioRepository;

    @Override
    @Transactional
    public EvaluacionResponse evaluar(EvaluacionRequest request) {
        Postulacion postulacion = postulacionRepository.findById(request.getIdPostulacion())
                .orElseThrow(() -> new ResourceNotFoundException("Postulación no encontrada con id: " + request.getIdPostulacion()));

        if (!postulacion.getEstado().equals(EstadoPostulacion.PENDIENTE)) {
            throw new BusinessException("Solo se pueden evaluar postulaciones en estado PENDIENTE");
        }

        if (evaluacionRepository.existsByPostulacionId(postulacion.getId())) {
            throw new BusinessException("Esta postulación ya tiene una evaluación registrada");
        }

        validarCubreTodosLosCriterios(request.getDetalles());

        Usuario evaluador = usuarioRepository.findById(request.getIdEvaluador())
                .orElseThrow(() -> new ResourceNotFoundException("Evaluador no encontrado con id: " + request.getIdEvaluador()));

        Evaluacion evaluacion = Evaluacion.builder()
                .postulacion(postulacion)
                .evaluador(evaluador)
                .fechaEvaluacion(LocalDate.now())
                .observaciones(request.getObservaciones())
                .build();

        evaluacion = evaluacionRepository.save(evaluacion);

        List<DetalleEvaluacion> detalles = crearDetalles(evaluacion, request.getDetalles());
        BigDecimal puntajeTotal = calcularPuntajeTotal(detalles);

        evaluacion.setPuntajeTotal(puntajeTotal);
        evaluacion = evaluacionRepository.save(evaluacion);

        // actualizar estado de la postulación a EVALUADA
        postulacion.setEstado(EstadoPostulacion.EVALUADA);
        postulacionRepository.save(postulacion);

        return buildResponse(evaluacion, detalles);
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluacionResponse obtenerPorPostulacion(Long idPostulacion) {
        Evaluacion evaluacion = evaluacionRepository.findByPostulacionId(idPostulacion)
                .orElseThrow(() -> new ResourceNotFoundException("No existe evaluación para la postulación con id: " + idPostulacion));

        List<DetalleEvaluacion> detalles = detalleRepository.findByEvaluacionId(evaluacion.getId());
        return buildResponse(evaluacion, detalles);
    }

    private List<DetalleEvaluacion> crearDetalles(Evaluacion evaluacion, List<DetalleEvaluacionRequest> requestDetalles) {
        List<DetalleEvaluacion> detalles = requestDetalles.stream().map(d -> {
            CriterioEvaluacion criterio = criterioRepository.findById(d.getIdCriterio())
                    .orElseThrow(() -> new ResourceNotFoundException("Criterio no encontrado con id: " + d.getIdCriterio()));
            return DetalleEvaluacion.builder()
                    .evaluacion(evaluacion)
                    .criterio(criterio)
                    .puntaje(d.getPuntaje())
                    .build();
        }).toList();

        return detalleRepository.saveAll(detalles);
    }

    private void validarCubreTodosLosCriterios(List<DetalleEvaluacionRequest> detalles) {
        Set<Long> idsEsperados = criterioRepository.findAllByOrderByOrdenAsc().stream()
                .map(CriterioEvaluacion::getId)
                .collect(Collectors.toSet());

        Set<Long> idsRecibidos = detalles.stream()
                .map(DetalleEvaluacionRequest::getIdCriterio)
                .collect(Collectors.toSet());

        if (idsRecibidos.size() != detalles.size()) {
            throw new BusinessException("No se puede calificar el mismo criterio más de una vez");
        }

        if (!idsRecibidos.equals(idsEsperados)) {
            throw new BusinessException("Debes calificar los " + idsEsperados.size() + " criterios de evaluación estandarizados, ni más ni menos");
        }
    }

    private BigDecimal calcularPuntajeTotal(List<DetalleEvaluacion> detalles) {
        // suma simple: cada criterio se califica de 1 a 10, sin ponderación
        return detalles.stream()
                .map(d -> BigDecimal.valueOf(d.getPuntaje()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private EvaluacionResponse buildResponse(Evaluacion ev, List<DetalleEvaluacion> detalles) {
        List<DetalleEvaluacionResponse> detalleResponses = detalles.stream()
                .map(d -> DetalleEvaluacionResponse.builder()
                        .id(d.getId())
                        .idCriterio(d.getCriterio().getId())
                        .nombreCriterio(d.getCriterio().getNombreCriterio())
                        .puntaje(d.getPuntaje())
                        .build())
                .toList();

        return EvaluacionResponse.builder()
                .id(ev.getId())
                .idPostulacion(ev.getPostulacion().getId())
                .nombrePostulante(ev.getPostulacion().getUsuario().getNombreCompleto())
                .idEvaluador(ev.getEvaluador().getId())
                .nombreEvaluador(ev.getEvaluador().getNombreCompleto())
                .fechaEvaluacion(ev.getFechaEvaluacion())
                .puntajeTotal(ev.getPuntajeTotal())
                .puntajeMaximo(detalles.size() * 10)
                .observaciones(ev.getObservaciones())
                .detalles(detalleResponses)
                .build();
    }
}
