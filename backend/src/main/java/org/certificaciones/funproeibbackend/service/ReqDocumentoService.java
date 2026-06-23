package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ReqDocumentoRequest;
import org.certificaciones.funproeibbackend.model.ReqDocumento;

import java.util.List;

public interface ReqDocumentoService {
    ReqDocumento crear(ReqDocumentoRequest request);
    List<ReqDocumento> listarPorPrograma(Long idPrograma);
}