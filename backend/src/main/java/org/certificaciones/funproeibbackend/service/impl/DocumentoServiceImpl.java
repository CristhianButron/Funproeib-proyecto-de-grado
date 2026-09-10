package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.DocumentoRequest;
import org.certificaciones.funproeibbackend.dto.DocumentoResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Documento;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import org.certificaciones.funproeibbackend.repository.DocumentoRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.ReqDocumentoRepository;
import org.certificaciones.funproeibbackend.service.DocumentoService;
import org.certificaciones.funproeibbackend.service.PostulacionCompletitudService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentoServiceImpl implements DocumentoService {

    private static final Map<String, String> EXTENSIONES_PERMITIDAS = Map.of(
            "pdf", "application/pdf",
            "doc", "application/msword",
            "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg"
    );
    private static final long TAMANO_MAXIMO_BYTES = 10L * 1024 * 1024;

    private final DocumentoRepository documentoRepository;
    private final PostulacionRepository postulacionRepository;
    private final ReqDocumentoRepository reqDocumentoRepository;
    private final PostulacionCompletitudService completitudService;

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

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

        // Revisa si con este documento la postulación queda completa (docs + preguntas)
        completitudService.revisar(postulacion.getId());

        return mapToResponse(guardado);
    }

    @Override
    @Transactional
    public DocumentoResponse subirArchivo(Long idPostulacion, Long idReqDocumento, MultipartFile archivo) {
        Postulacion postulacion = postulacionRepository.findById(idPostulacion)
                .orElseThrow(() -> new ResourceNotFoundException("Postulación no encontrada con id: " + idPostulacion));

        ReqDocumento reqDocumento = reqDocumentoRepository.findById(idReqDocumento)
                .orElseThrow(() -> new ResourceNotFoundException("Requisito de documento no encontrado con id: " + idReqDocumento));

        if (reqDocumento.getTipoPermitido() != TipoDocumento.PDF) {
            throw new BusinessException("Este requisito espera un enlace, no un archivo. Usa el campo de enlace.");
        }

        if (archivo == null || archivo.isEmpty()) {
            throw new BusinessException("Debes seleccionar un archivo");
        }
        if (archivo.getSize() > TAMANO_MAXIMO_BYTES) {
            throw new BusinessException("El archivo supera el tamaño máximo permitido (10MB)");
        }

        String nombreOriginal = StringUtils.cleanPath(
                archivo.getOriginalFilename() == null || archivo.getOriginalFilename().isBlank()
                        ? "archivo" : archivo.getOriginalFilename());
        String extension = obtenerExtension(nombreOriginal);
        if (!EXTENSIONES_PERMITIDAS.containsKey(extension)) {
            throw new BusinessException("Tipo de archivo no permitido. Formatos aceptados: PDF, DOC, DOCX, PNG, JPG");
        }

        try {
            Path carpetaPostulacion = Paths.get(uploadsDir, "postulacion-" + idPostulacion).toAbsolutePath().normalize();
            Files.createDirectories(carpetaPostulacion);

            String nombreGuardado = UUID.randomUUID() + "__" + sanitizar(nombreOriginal);
            Path destino = carpetaPostulacion.resolve(nombreGuardado).normalize();
            if (!destino.startsWith(carpetaPostulacion)) {
                throw new BusinessException("Nombre de archivo inválido");
            }
            archivo.transferTo(destino);

            Documento documento = Documento.builder()
                    .postulacion(postulacion)
                    .reqDocumento(reqDocumento)
                    .rutaArchivo("postulacion-" + idPostulacion + "/" + nombreGuardado)
                    .tipo(TipoDocumento.PDF)
                    .fechaCarga(LocalDate.now())
                    .verificado(false)
                    .build();

            Documento guardado = documentoRepository.save(documento);
            completitudService.revisar(postulacion.getId());
            return mapToResponse(guardado);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar el archivo", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ArchivoDescargable descargar(Long idDocumento) {
        Documento documento = documentoRepository.findById(idDocumento)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado con id: " + idDocumento));

        if (documento.getTipo() != TipoDocumento.PDF || documento.getRutaArchivo() == null) {
            throw new BusinessException("Este documento no tiene un archivo para descargar; es un enlace");
        }

        try {
            Path raiz = Paths.get(uploadsDir).toAbsolutePath().normalize();
            Path ruta = raiz.resolve(documento.getRutaArchivo()).normalize();
            if (!ruta.startsWith(raiz) || !Files.exists(ruta)) {
                throw new ResourceNotFoundException("El archivo ya no está disponible en el servidor");
            }

            int separador = documento.getRutaArchivo().indexOf("__");
            String nombreOriginal = separador >= 0
                    ? documento.getRutaArchivo().substring(separador + 2)
                    : documento.getRutaArchivo();

            String contentType = Files.probeContentType(ruta);
            Resource recurso = new UrlResource(ruta.toUri());

            return ArchivoDescargable.builder()
                    .recurso(recurso)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .nombreArchivo(nombreOriginal)
                    .build();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo", e);
        }
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

    private String obtenerExtension(String nombreArchivo) {
        int punto = nombreArchivo.lastIndexOf('.');
        return punto >= 0 && punto < nombreArchivo.length() - 1
                ? nombreArchivo.substring(punto + 1).toLowerCase()
                : "";
    }

    private String sanitizar(String nombreArchivo) {
        String limpio = nombreArchivo.replaceAll("[^a-zA-Z0-9._-]", "_");
        return limpio.length() > 100 ? limpio.substring(limpio.length() - 100) : limpio;
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
