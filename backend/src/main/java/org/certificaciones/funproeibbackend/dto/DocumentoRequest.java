package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DocumentoRequest {

    @NotNull
    private Long idPostulacion;

    @NotNull
    private Long idReqDocumento;

    @NotNull
    private String rutaArchivo;

    @NotNull
    private TipoDocumento tipo;
}