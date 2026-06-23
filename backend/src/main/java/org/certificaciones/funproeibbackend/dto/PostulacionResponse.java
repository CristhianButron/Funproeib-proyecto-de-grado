package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class PostulacionResponse {
    private Long id;
    private Long idUsuario;
    private String nombrePostulante;
    private Long idPrograma;
    private String nombrePrograma;
    private LocalDate fechaPostulacion;
    private EstadoPostulacion estado;
}