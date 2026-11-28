package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.MotivoListaNegra;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class ListaNegraResponse {
    private Long id;
    private String ciPostulante;
    private String nombrePostulante;
    private MotivoListaNegra motivo;
    private String observaciones;
    private LocalDate fechaRegistro;
    private String registradoPorNombre;
    private Boolean activo;
}
