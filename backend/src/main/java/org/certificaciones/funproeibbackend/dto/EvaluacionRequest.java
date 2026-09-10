package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class EvaluacionRequest {

    @NotNull
    private Long idPostulacion;

    @NotNull
    private Long idEvaluador;

    private String observaciones;

    @NotEmpty
    @Valid
    private List<DetalleEvaluacionRequest> detalles;
}
