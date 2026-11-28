package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ListaNegraCandidatoResponse {
    private Long idUsuario;
    private String nombreCompleto;
    private String ci;
    private List<String> programas;
}
