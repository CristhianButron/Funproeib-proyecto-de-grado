package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.RespuestaRequest;
import org.certificaciones.funproeibbackend.dto.RespuestaResponse;

import java.util.List;

public interface RespuestaService {
    RespuestaResponse guardar(RespuestaRequest request);
    List<RespuestaResponse> listarPorPostulacion(Long idPostulacion);
}
