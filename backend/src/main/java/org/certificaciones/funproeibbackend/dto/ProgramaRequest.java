package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProgramaRequest {

    @NotBlank
    @Size(max = 150)
    private String nombre;

    @NotNull
    private TipoPrograma tipo;

    @Size(max = 10)
    private String edicion;

    @NotNull
    private LocalDate fechaInicio;

    @NotNull
    private LocalDate fechaFin;

    @NotNull
    @Min(1)
    private Integer cuposDisponibles;
}