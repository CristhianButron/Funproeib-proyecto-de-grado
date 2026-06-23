package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReqDocumentoRequest {

    @NotNull
    private Long idPrograma;

    @NotBlank
    @Size(max = 150)
    private String nombreDocumento;

    @Size(max = 255)
    private String descripcion;

    private Boolean obligatorio = true;

    @NotNull
    private TipoDocumento tipoPermitido;
}