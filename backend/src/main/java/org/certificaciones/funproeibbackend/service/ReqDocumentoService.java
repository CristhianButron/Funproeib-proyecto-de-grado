package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ReqDocumentoRequest;
import org.certificaciones.funproeibbackend.dto.ReqDocumentoResponse;

import java.util.List;

public interface ReqDocumentoService {
    ReqDocumentoResponse crear(ReqDocumentoRequest request);
    List<ReqDocumentoResponse> listarPorPrograma(Long idPrograma);
}
