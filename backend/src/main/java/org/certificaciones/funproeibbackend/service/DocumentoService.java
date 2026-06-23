package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.DocumentoRequest;
import org.certificaciones.funproeibbackend.dto.DocumentoResponse;

import java.util.List;

public interface DocumentoService {
    DocumentoResponse registrar(DocumentoRequest request);
    List<DocumentoResponse> listarPorPostulacion(Long idPostulacion);
    DocumentoResponse verificar(Long idDocumento);
    void verificarTodosDePostulacion(Long idPostulacion);
}
