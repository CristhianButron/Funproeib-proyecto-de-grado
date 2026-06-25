package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.ReqDocumentoRequest;
import org.certificaciones.funproeibbackend.dto.ReqDocumentoResponse;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.repository.ReqDocumentoRepository;
import org.certificaciones.funproeibbackend.service.ReqDocumentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReqDocumentoServiceImpl implements ReqDocumentoService {

    private final ReqDocumentoRepository reqDocumentoRepository;
    private final ProgramaRepository programaRepository;

    @Override
    @Transactional
    public ReqDocumentoResponse crear(ReqDocumentoRequest request) {
        Programa programa = programaRepository.findById(request.getIdPrograma())
                .orElseThrow(() -> new ResourceNotFoundException("Programa no encontrado con id: " + request.getIdPrograma()));

        ReqDocumento reqDocumento = ReqDocumento.builder()
                .programa(programa)
                .nombreDocumento(request.getNombreDocumento())
                .descripcion(request.getDescripcion())
                .obligatorio(request.getObligatorio())
                .tipoPermitido(request.getTipoPermitido())
                .build();

        return mapToResponse(reqDocumentoRepository.save(reqDocumento));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReqDocumentoResponse> listarPorPrograma(Long idPrograma) {
        return reqDocumentoRepository.findByProgramaId(idPrograma).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private ReqDocumentoResponse mapToResponse(ReqDocumento r) {
        return ReqDocumentoResponse.builder()
                .id(r.getId())
                .idPrograma(r.getPrograma().getId())
                .nombrePrograma(r.getPrograma().getNombre())
                .nombreDocumento(r.getNombreDocumento())
                .descripcion(r.getDescripcion())
                .obligatorio(r.getObligatorio())
                .tipoPermitido(r.getTipoPermitido())
                .build();
    }
}
