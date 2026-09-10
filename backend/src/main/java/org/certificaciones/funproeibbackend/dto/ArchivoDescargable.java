package org.certificaciones.funproeibbackend.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.core.io.Resource;

@Data
@Builder
public class ArchivoDescargable {
    private Resource recurso;
    private String contentType;
    private String nombreArchivo;
}
