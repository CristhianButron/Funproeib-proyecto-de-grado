package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.MotivoListaNegra;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ListaNegraRequest {

    @NotBlank
    private String ciPostulante;

    @NotNull
    private MotivoListaNegra motivo;

    @NotNull
    private Long idRegistradoPor;
}
