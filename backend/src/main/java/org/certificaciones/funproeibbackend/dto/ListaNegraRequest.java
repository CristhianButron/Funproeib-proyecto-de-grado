package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.MotivoListaNegra;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ListaNegraRequest {

    @NotBlank(message = "El CI del postulante es obligatorio")
    private String ciPostulante;

    @NotNull(message = "El motivo es obligatorio")
    private MotivoListaNegra motivo;

    @NotNull
    private Long idRegistradoPor;

    @Size(max = 500, message = "Las observaciones no pueden superar los 500 caracteres")
    private String observaciones;
}
