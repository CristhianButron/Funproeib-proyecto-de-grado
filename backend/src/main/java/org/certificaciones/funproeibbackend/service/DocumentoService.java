package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.DocumentoRequest;
import org.certificaciones.funproeibbackend.dto.DocumentoResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentoService {
    DocumentoResponse registrar(DocumentoRequest request);
    DocumentoResponse subirArchivo(Long idPostulacion, Long idReqDocumento, MultipartFile archivo);
    ArchivoDescargable descargar(Long idDocumento);
    List<DocumentoResponse> listarPorPostulacion(Long idPostulacion);
    DocumentoResponse verificar(Long idDocumento);
    void verificarTodosDePostulacion(Long idPostulacion);
}
