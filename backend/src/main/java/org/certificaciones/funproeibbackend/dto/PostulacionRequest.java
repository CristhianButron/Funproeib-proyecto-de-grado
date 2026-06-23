package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PostulacionRequest {

    @NotNull
    private Long idUsuario;

    @NotNull
    private Long idPrograma;
}