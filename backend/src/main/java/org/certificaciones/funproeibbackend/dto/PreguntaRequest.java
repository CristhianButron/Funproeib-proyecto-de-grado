package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PreguntaRequest {

    @NotNull
    private Long idPrograma;

    @NotBlank
    @Size(max = 500)
    private String enunciado;

    private Integer orden = 1;
}
