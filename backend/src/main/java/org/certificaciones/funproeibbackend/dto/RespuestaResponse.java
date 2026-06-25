package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RespuestaResponse {
    private Long id;
    private Long idPregunta;
    private String enunciado;
    private String respuesta;
}
