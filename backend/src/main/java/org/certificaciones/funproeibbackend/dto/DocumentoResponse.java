package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class DocumentoResponse {
    private Long id;
    private Long idPostulacion;
    private Long idReqDocumento;
    private String nombreReqDocumento;
    private String rutaArchivo;
    private TipoDocumento tipo;
    private LocalDate fechaCarga;
    private Boolean verificado;
}
