package org.certificaciones.funproeibbackend.service;

public interface PostulacionCompletitudService {
    /**
     * Revisa si la postulación cumple todos los requisitos (documentos obligatorios
     * cargados y preguntas respondidas). Si está completa y aún está INCOMPLETA,
     * la avanza a PENDIENTE.
     */
    void revisar(Long idPostulacion);
}
