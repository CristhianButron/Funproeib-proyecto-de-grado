package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.model.Documento;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.PreguntaPostulacion;
import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.certificaciones.funproeibbackend.model.RespuestaPostulacion;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.repository.*;
import org.certificaciones.funproeibbackend.service.PostulacionCompletitudService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostulacionCompletitudServiceImpl implements PostulacionCompletitudService {

    private final PostulacionRepository postulacionRepository;
    private final ReqDocumentoRepository reqDocumentoRepository;
    private final DocumentoRepository documentoRepository;
    private final PreguntaPostulacionRepository preguntaRepository;
    private final RespuestaPostulacionRepository respuestaRepository;

    @Override
    @Transactional
    public void revisar(Long idPostulacion) {
        Postulacion postulacion = postulacionRepository.findById(idPostulacion).orElse(null);
        if (postulacion == null) {
            return;
        }
        // Una vez evaluada/aceptada/rechazada/bloqueada, la decisión ya está
        // tomada: borrar o volver a subir un documento después no debe
        // reabrir la postulación. Solo se recalcula mientras sigue en
        // trámite (INCOMPLETA o PENDIENTE).
        if (postulacion.getEstado() != EstadoPostulacion.INCOMPLETA
                && postulacion.getEstado() != EstadoPostulacion.PENDIENTE) {
            return;
        }

        Long idPrograma = postulacion.getPrograma().getId();

        // 1) Todos los documentos obligatorios deben estar cargados
        List<ReqDocumento> obligatorios = reqDocumentoRepository.findByProgramaId(idPrograma)
                .stream().filter(ReqDocumento::getObligatorio).toList();
        List<Documento> cargados = documentoRepository.findByPostulacionId(idPostulacion);
        boolean docsCompletos = obligatorios.stream().allMatch(req ->
                cargados.stream().anyMatch(doc -> doc.getReqDocumento().getId().equals(req.getId())));

        // 2) Todas las preguntas deben tener respuesta no vacía
        List<PreguntaPostulacion> preguntas = preguntaRepository.findByProgramaIdOrderByOrdenAsc(idPrograma);
        List<RespuestaPostulacion> respuestas = respuestaRepository.findByPostulacionId(idPostulacion);
        boolean preguntasRespondidas = preguntas.stream().allMatch(p ->
                respuestas.stream().anyMatch(r -> r.getPregunta().getId().equals(p.getId())
                        && r.getRespuesta() != null && !r.getRespuesta().isBlank()));

        if (docsCompletos && preguntasRespondidas) {
            if (postulacion.getEstado() != EstadoPostulacion.PENDIENTE) {
                postulacion.setEstado(EstadoPostulacion.PENDIENTE);
                postulacionRepository.save(postulacion);
            }
        } else if (postulacion.getEstado() != EstadoPostulacion.INCOMPLETA) {
            // Se eliminó un documento (o quedó sin respuesta) que hacía
            // falta: vuelve a INCOMPLETA hasta que se complete de nuevo.
            postulacion.setEstado(EstadoPostulacion.INCOMPLETA);
            postulacionRepository.save(postulacion);
        }
    }
}
