package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CriterioEvaluacionRequest {

    @NotBlank(message = "El nombre del criterio es obligatorio")
    @Size(max = 150)
    private String nombreCriterio;

    @Size(max = 500)
    private String descripcion;
}
