package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class CriterioEvaluacionResponse {
    private Long id;
    private Long idPrograma;
    private String nombrePrograma;
    private String nombreCriterio;
    private String descripcion;
    private BigDecimal peso;
}
