package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class EvaluacionResponse {
    private Long id;
    private Long idPostulacion;
    private String nombrePostulante;
    private Long idEvaluador;
    private String nombreEvaluador;
    private LocalDate fechaEvaluacion;
    private BigDecimal puntajeTotal;
    private String observaciones;
    private List<DetalleEvaluacionResponse> detalles;
}
