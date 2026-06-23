package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;

import java.util.List;

public interface CriterioEvaluacionService {
    CriterioEvaluacionResponse crear(CriterioEvaluacionRequest request);
    List<CriterioEvaluacionResponse> listarPorPrograma(Long idPrograma);
    void eliminar(Long id);
}
