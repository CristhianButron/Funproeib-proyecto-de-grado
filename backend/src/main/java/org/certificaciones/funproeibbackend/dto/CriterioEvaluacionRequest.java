package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CriterioEvaluacionRequest {

    @NotNull
    private Long idPrograma;

    @NotBlank
    private String nombreCriterio;

    private String descripcion;

    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("100.00")
    private BigDecimal peso;
}
