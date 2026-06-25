package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.PreguntaRequest;
import org.certificaciones.funproeibbackend.dto.PreguntaResponse;

import java.util.List;

public interface PreguntaService {
    PreguntaResponse crear(PreguntaRequest request);
    List<PreguntaResponse> listarPorPrograma(Long idPrograma);
    void eliminar(Long id);
}
