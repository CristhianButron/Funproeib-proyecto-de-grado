package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.DocumentoRequest;
import org.certificaciones.funproeibbackend.dto.DocumentoResponse;
import org.certificaciones.funproeibbackend.service.DocumentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoService documentoService;

    @PostMapping
    public ResponseEntity<DocumentoResponse> registrar(@Valid @RequestBody DocumentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentoService.registrar(request));
    }

    @PostMapping(value = "/subir", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentoResponse> subir(
            @RequestParam Long idPostulacion,
            @RequestParam Long idReqDocumento,
            @RequestParam("archivo") MultipartFile archivo) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentoService.subirArchivo(idPostulacion, idReqDocumento, archivo));
    }

    @GetMapping("/{id}/archivo")
    public ResponseEntity<Resource> descargar(@PathVariable Long id) {
        ArchivoDescargable archivo = documentoService.descargar(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + archivo.getNombreArchivo() + "\"")
                .body(archivo.getRecurso());
    }

    @GetMapping("/postulacion/{idPostulacion}")
    public ResponseEntity<List<DocumentoResponse>> listarPorPostulacion(@PathVariable Long idPostulacion) {
        return ResponseEntity.ok(documentoService.listarPorPostulacion(idPostulacion));
    }

    @PatchMapping("/{id}/verificar")
    public ResponseEntity<DocumentoResponse> verificar(@PathVariable Long id) {
        return ResponseEntity.ok(documentoService.verificar(id));
    }

    @PatchMapping("/postulacion/{idPostulacion}/verificar-todos")
    public ResponseEntity<Void> verificarTodos(@PathVariable Long idPostulacion) {
        documentoService.verificarTodosDePostulacion(idPostulacion);
        return ResponseEntity.noContent().build();
    }
}
