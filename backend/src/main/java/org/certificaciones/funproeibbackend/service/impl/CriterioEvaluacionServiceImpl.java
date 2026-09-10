package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;
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

    private CriterioEvaluacionResponse mapToResponse(CriterioEvaluacion c) {
        return CriterioEvaluacionResponse.builder()
                .id(c.getId())
                .orden(c.getOrden())
                .nombreCriterio(c.getNombreCriterio())
                .descripcion(c.getDescripcion())
                .build();
    }
}
