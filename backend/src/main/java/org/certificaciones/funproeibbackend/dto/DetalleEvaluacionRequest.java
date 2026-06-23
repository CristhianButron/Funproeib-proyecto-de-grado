package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DetalleEvaluacionRequest {

    @NotNull
    private Long idCriterio;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer puntaje;
}
