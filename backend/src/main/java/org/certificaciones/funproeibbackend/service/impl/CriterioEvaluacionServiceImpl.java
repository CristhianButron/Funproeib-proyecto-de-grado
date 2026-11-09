package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.CriterioEvaluacion;
import org.certificaciones.funproeibbackend.repository.CriterioEvaluacionRepository;
import org.certificaciones.funproeibbackend.service.CriterioEvaluacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CriterioEvaluacionServiceImpl implements CriterioEvaluacionService {

    private final CriterioEvaluacionRepository criterioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CriterioEvaluacionResponse> listarTodos() {
        return criterioRepository.findAllByOrderByOrdenAsc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CriterioEvaluacionResponse> listarActivos() {
        return criterioRepository.findByActivoTrueOrderByOrdenAsc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public CriterioEvaluacionResponse crear(CriterioEvaluacionRequest request) {
        if (criterioRepository.existsByNombreCriterioIgnoreCase(request.getNombreCriterio())) {
            throw new BusinessException("Ya existe un criterio con ese nombre");
        }

        int siguienteOrden = criterioRepository.findFirstByOrderByOrdenDesc()
                .map(c -> c.getOrden() + 1)
                .orElse(1);

        CriterioEvaluacion criterio = CriterioEvaluacion.builder()
                .orden(siguienteOrden)
                .nombreCriterio(request.getNombreCriterio())
                .descripcion(request.getDescripcion())
                .activo(true)
                .build();

        return mapToResponse(criterioRepository.save(criterio));
    }

    @Override
    @Transactional
    public CriterioEvaluacionResponse actualizar(Long id, CriterioEvaluacionRequest request) {
        CriterioEvaluacion criterio = buscarCriterio(id);

        if (!criterio.getNombreCriterio().equalsIgnoreCase(request.getNombreCriterio())
                && criterioRepository.existsByNombreCriterioIgnoreCase(request.getNombreCriterio())) {
            throw new BusinessException("Ya existe un criterio con ese nombre");
        }

        criterio.setNombreCriterio(request.getNombreCriterio());
        criterio.setDescripcion(request.getDescripcion());

        criterioRepository.save(criterio);
        return mapToResponse(criterio);
    }

    @Override
    @Transactional
    public CriterioEvaluacionResponse cambiarActivo(Long id, boolean activo) {
        CriterioEvaluacion criterio = buscarCriterio(id);

        if (!activo && Boolean.TRUE.equals(criterio.getActivo()) && criterioRepository.countByActivoTrue() <= 1) {
            throw new BusinessException("Debe haber al menos un criterio de evaluación activo");
        }

        criterio.setActivo(activo);
        criterioRepository.save(criterio);
        return mapToResponse(criterio);
    }

    private CriterioEvaluacion buscarCriterio(Long id) {
        return criterioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Criterio de evaluación no encontrado con id: " + id));
    }

    private CriterioEvaluacionResponse mapToResponse(CriterioEvaluacion c) {
        return CriterioEvaluacionResponse.builder()
                .id(c.getId())
                .orden(c.getOrden())
                .nombreCriterio(c.getNombreCriterio())
                .descripcion(c.getDescripcion())
                .activo(c.getActivo())
                .build();
    }
}
