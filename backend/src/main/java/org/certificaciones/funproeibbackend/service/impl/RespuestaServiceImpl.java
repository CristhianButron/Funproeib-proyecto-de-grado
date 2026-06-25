package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.RespuestaRequest;
import org.certificaciones.funproeibbackend.dto.RespuestaResponse;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.PreguntaPostulacion;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.RespuestaPostulacion;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.PreguntaPostulacionRepository;
import org.certificaciones.funproeibbackend.repository.RespuestaPostulacionRepository;
import org.certificaciones.funproeibbackend.service.PostulacionCompletitudService;
import org.certificaciones.funproeibbackend.service.RespuestaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RespuestaServiceImpl implements RespuestaService {

    private final RespuestaPostulacionRepository respuestaRepository;
    private final PostulacionRepository postulacionRepository;
    private final PreguntaPostulacionRepository preguntaRepository;
    private final PostulacionCompletitudService completitudService;

    @Override
    @Transactional
    public RespuestaResponse guardar(RespuestaRequest request) {
        Postulacion postulacion = postulacionRepository.findById(request.getIdPostulacion())
                .orElseThrow(() -> new ResourceNotFoundException("Postulación no encontrada con id: " + request.getIdPostulacion()));
        PreguntaPostulacion pregunta = preguntaRepository.findById(request.getIdPregunta())
                .orElseThrow(() -> new ResourceNotFoundException("Pregunta no encontrada con id: " + request.getIdPregunta()));

        // upsert: si ya respondió esa pregunta, actualiza; si no, crea
        RespuestaPostulacion respuesta = respuestaRepository
                .findByPostulacionIdAndPreguntaId(postulacion.getId(), pregunta.getId())
                .orElseGet(() -> RespuestaPostulacion.builder()
                        .postulacion(postulacion).pregunta(pregunta).build());
        respuesta.setRespuesta(request.getRespuesta());

        RespuestaPostulacion guardada = respuestaRepository.save(respuesta);

        // al responder puede completarse la postulación
        completitudService.revisar(postulacion.getId());

        return mapToResponse(guardada);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RespuestaResponse> listarPorPostulacion(Long idPostulacion) {
        return respuestaRepository.findByPostulacionId(idPostulacion).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private RespuestaResponse mapToResponse(RespuestaPostulacion r) {
        return RespuestaResponse.builder()
                .id(r.getId())
                .idPregunta(r.getPregunta().getId())
                .enunciado(r.getPregunta().getEnunciado())
                .respuesta(r.getRespuesta())
                .build();
    }
}
