package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PreguntaResponse {
    private Long id;
    private Long idPrograma;
    private String enunciado;
    private Integer orden;
}
