package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;

import java.util.List;

public interface CriterioEvaluacionService {
    List<CriterioEvaluacionResponse> listarTodos();
}
