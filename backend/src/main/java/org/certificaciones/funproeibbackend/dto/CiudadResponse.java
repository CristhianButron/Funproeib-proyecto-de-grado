package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CiudadResponse {
    private Long id;
    private String nombre;
    private Long idPais;
    private String nombrePais;
}
