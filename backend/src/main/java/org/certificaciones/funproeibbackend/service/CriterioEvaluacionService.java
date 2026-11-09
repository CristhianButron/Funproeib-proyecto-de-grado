package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;

import java.util.List;

public interface CriterioEvaluacionService {
    List<CriterioEvaluacionResponse> listarTodos();
    List<CriterioEvaluacionResponse> listarActivos();
    CriterioEvaluacionResponse crear(CriterioEvaluacionRequest request);
    CriterioEvaluacionResponse actualizar(Long id, CriterioEvaluacionRequest request);
    CriterioEvaluacionResponse cambiarActivo(Long id, boolean activo);
}
