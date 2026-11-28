package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class ProgramaRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
    private String nombre;

    @NotNull(message = "El tipo de programa es obligatorio")
    private TipoPrograma tipo;

    @Size(max = 10)
    private String edicion;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate fechaFin;

    @NotNull(message = "Los cupos disponibles son obligatorios")
    @Min(value = 1, message = "Los cupos disponibles deben ser al menos 1")
    private Integer cuposDisponibles;

    @Size(max = 4000)
    private String descripcion;

    private List<@Size(max = 255) String> modulos;
}