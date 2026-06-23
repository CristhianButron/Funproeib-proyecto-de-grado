package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.DocumentoRequest;
import org.certificaciones.funproeibbackend.dto.DocumentoResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Documento;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.repository.DocumentoRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.ReqDocumentoRepository;
import org.certificaciones.funproeibbackend.service.DocumentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentoServiceImpl implements DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final PostulacionRepository postulacionRepository;
    private final ReqDocumentoRepository reqDocumentoRepository;

    @Override
    @Transactional
    public DocumentoResponse registrar(DocumentoRequest request) {
        Postulacion postulacion = postulacionRepository.findById(request.getIdPostulacion())
                .orElseThrow(() -> new ResourceNotFoundException("Postulación no encontrada con id: " + request.getIdPostulacion()));

        ReqDocumento reqDocumento = reqDocumentoRepository.findById(request.getIdReqDocumento())
                .orElseThrow(() -> new ResourceNotFoundException("Requisito de documento no encontrado con id: " + request.getIdReqDocumento()));

        if (!reqDocumento.getTipoPermitido().equals(request.getTipo())) {
            throw new BusinessException("El tipo de documento no coincide con el tipo permitido: " + reqDocumento.getTipoPermitido());
        }

        Documento documento = Documento.builder()
                .postulacion(postulacion)
                .reqDocumento(reqDocumento)
                .rutaArchivo(request.getRutaArchivo())
                .tipo(request.getTipo())
                .fechaCarga(LocalDate.now())
                .verificado(false)
                .build();

        Documento guardado = documentoRepository.save(documento);

        // si todos los requisitos obligatorios están cargados, avanzar la postulación a PENDIENTE
        actualizarEstadoPostulacion(postulacion);

        return mapToResponse(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentoResponse> listarPorPostulacion(Long idPostulacion) {
        return documentoRepository.findByPostulacionId(idPostulacion).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public DocumentoResponse verificar(Long idDocumento) {
        Documento documento = documentoRepository.findById(idDocumento)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado con id: " + idDocumento));
        documento.setVerificado(true);
        return mapToResponse(documentoRepository.save(documento));
    }

    @Override
    @Transactional
    public void verificarTodosDePostulacion(Long idPostulacion) {
        List<Documento> documentos = documentoRepository.findByPostulacionId(idPostulacion);
        if (documentos.isEmpty()) {
            throw new BusinessException("La postulación no tiene documentos registrados");
        }
        documentos.forEach(d -> d.setVerificado(true));
        documentoRepository.saveAll(documentos);
    }

    private void actualizarEstadoPostulacion(Postulacion postulacion) {
        List<ReqDocumento> obligatorios = reqDocumentoRepository.findByProgramaId(postulacion.getPrograma().getId())
                .stream().filter(ReqDocumento::getObligatorio).toList();

        List<Documento> cargados = documentoRepository.findByPostulacionId(postulacion.getId());

        boolean todosPresentes = obligatorios.stream().allMatch(req ->
                cargados.stream().anyMatch(doc -> doc.getReqDocumento().getId().equals(req.getId()))
        );

        if (todosPresentes && postulacion.getEstado().equals(EstadoPostulacion.INCOMPLETA)) {
            postulacion.setEstado(EstadoPostulacion.PENDIENTE);
            postulacionRepository.save(postulacion);
        }
    }

    private DocumentoResponse mapToResponse(Documento d) {
        return DocumentoResponse.builder()
                .id(d.getId())
                .idPostulacion(d.getPostulacion().getId())
                .idReqDocumento(d.getReqDocumento().getId())
                .nombreReqDocumento(d.getReqDocumento().getNombreDocumento())
                .rutaArchivo(d.getRutaArchivo())
                .tipo(d.getTipo())
                .fechaCarga(d.getFechaCarga())
                .verificado(d.getVerificado())
                .build();
    }
}
