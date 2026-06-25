package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.CriterioEvaluacion;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.repository.CriterioEvaluacionRepository;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.service.CriterioEvaluacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CriterioEvaluacionServiceImpl implements CriterioEvaluacionService {

    private final CriterioEvaluacionRepository criterioRepository;
    private final ProgramaRepository programaRepository;

    @Override
    @Transactional
    public CriterioEvaluacionResponse crear(CriterioEvaluacionRequest request) {
        Programa programa = programaRepository.findById(request.getIdPrograma())
                .orElseThrow(() -> new ResourceNotFoundException("Programa no encontrado con id: " + request.getIdPrograma()));

        CriterioEvaluacion criterio = CriterioEvaluacion.builder()
                .programa(programa)
                .nombreCriterio(request.getNombreCriterio())
                .descripcion(request.getDescripcion())
                .peso(request.getPeso())
                .build();

        return mapToResponse(criterioRepository.save(criterio));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CriterioEvaluacionResponse> listarPorPrograma(Long idPrograma) {
        return criterioRepository.findByProgramaId(idPrograma).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        if (!criterioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Criterio no encontrado con id: " + id);
        }
        criterioRepository.deleteById(id);
    }

    private CriterioEvaluacionResponse mapToResponse(CriterioEvaluacion c) {
        return CriterioEvaluacionResponse.builder()
                .id(c.getId())
                .idPrograma(c.getPrograma().getId())
                .nombrePrograma(c.getPrograma().getNombre())
                .nombreCriterio(c.getNombreCriterio())
                .descripcion(c.getDescripcion())
                .peso(c.getPeso())
                .build();
    }
}
