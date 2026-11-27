package org.certificaciones.funproeibbackend.service;

public interface PostulacionCompletitudService {
    /**
     * Revisa si la postulación cumple todos los requisitos (documentos obligatorios
     * cargados y preguntas respondidas). La mueve entre INCOMPLETA y PENDIENTE
     * según corresponda (en cualquiera de los dos sentidos: también retrocede
     * a INCOMPLETA si se elimina un documento que hacía falta). No toca
     * postulaciones ya EVALUADA/ACEPTADA/RECHAZADA/BLOQUEADA.
     */
    void revisar(Long idPostulacion);
}
