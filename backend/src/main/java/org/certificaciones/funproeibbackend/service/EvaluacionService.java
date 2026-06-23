package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.EvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.EvaluacionResponse;

public interface EvaluacionService {
    EvaluacionResponse evaluar(EvaluacionRequest request);
    EvaluacionResponse obtenerPorPostulacion(Long idPostulacion);
}
