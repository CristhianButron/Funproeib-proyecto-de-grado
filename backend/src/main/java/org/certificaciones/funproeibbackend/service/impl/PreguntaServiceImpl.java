package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.PreguntaRequest;
import org.certificaciones.funproeibbackend.dto.PreguntaResponse;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.PreguntaPostulacion;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.repository.PreguntaPostulacionRepository;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.service.PreguntaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PreguntaServiceImpl implements PreguntaService {

    private final PreguntaPostulacionRepository preguntaRepository;
    private final ProgramaRepository programaRepository;

    @Override
    @Transactional
    public PreguntaResponse crear(PreguntaRequest request) {
        Programa programa = programaRepository.findById(request.getIdPrograma())
                .orElseThrow(() -> new ResourceNotFoundException("Programa no encontrado con id: " + request.getIdPrograma()));

        PreguntaPostulacion pregunta = PreguntaPostulacion.builder()
                .programa(programa)
                .enunciado(request.getEnunciado())
                .orden(request.getOrden() != null ? request.getOrden() : 1)
                .build();

        return mapToResponse(preguntaRepository.save(pregunta));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PreguntaResponse> listarPorPrograma(Long idPrograma) {
        return preguntaRepository.findByProgramaIdOrderByOrdenAsc(idPrograma).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        if (!preguntaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Pregunta no encontrada con id: " + id);
        }
        preguntaRepository.deleteById(id);
    }

    private PreguntaResponse mapToResponse(PreguntaPostulacion p) {
        return PreguntaResponse.builder()
                .id(p.getId())
                .idPrograma(p.getPrograma().getId())
                .enunciado(p.getEnunciado())
                .orden(p.getOrden())
                .build();
    }
}
