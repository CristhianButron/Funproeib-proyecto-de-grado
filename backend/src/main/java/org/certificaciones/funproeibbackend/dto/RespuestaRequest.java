package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RespuestaRequest {

    @NotNull
    private Long idPostulacion;

    @NotNull
    private Long idPregunta;

    private String respuesta;
}
