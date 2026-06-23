package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReqDocumentoResponse {
    private Long id;
    private Long idPrograma;
    private String nombrePrograma;
    private String nombreDocumento;
    private String descripcion;
    private Boolean obligatorio;
    private TipoDocumento tipoPermitido;
}
