package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaisResponse {
    private Long id;
    private String nombre;
}
