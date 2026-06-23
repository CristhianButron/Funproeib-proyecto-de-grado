package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DetalleEvaluacionResponse {
    private Long id;
    private Long idCriterio;
    private String nombreCriterio;
    private Integer puntaje;
}
