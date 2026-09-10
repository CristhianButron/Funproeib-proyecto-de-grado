package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CriterioEvaluacionResponse {
    private Long id;
    private Integer orden;
    private String nombreCriterio;
    private String descripcion;
}
