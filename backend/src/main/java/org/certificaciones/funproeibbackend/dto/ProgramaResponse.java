package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ProgramaResponse {
    private Long id;
    private String nombre;
    private TipoPrograma tipo;
    private String edicion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Integer cuposDisponibles;
    private EstadoPrograma estado;
    private String descripcion;
    private List<String> modulos;
    private List<String> requisitosGenerales;
}