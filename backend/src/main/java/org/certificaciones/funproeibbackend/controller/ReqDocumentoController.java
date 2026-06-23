package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.ReqDocumentoRequest;
import org.certificaciones.funproeibbackend.dto.ReqDocumentoResponse;
import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.certificaciones.funproeibbackend.service.ReqDocumentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/req-documentos")
@RequiredArgsConstructor
public class ReqDocumentoController {

    private final ReqDocumentoService reqDocumentoService;

    @PostMapping
    public ResponseEntity<ReqDocumentoResponse> crear(@Valid @RequestBody ReqDocumentoRequest request) {
        ReqDocumento saved = reqDocumentoService.crear(request);
        ReqDocumentoResponse response = ReqDocumentoResponse.builder()
                .id(saved.getId())
                .idPrograma(saved.getPrograma().getId())
                .nombrePrograma(saved.getPrograma().getNombre())
                .nombreDocumento(saved.getNombreDocumento())
                .descripcion(saved.getDescripcion())
                .obligatorio(saved.getObligatorio())
                .tipoPermitido(saved.getTipoPermitido())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/programa/{idPrograma}")
    public ResponseEntity<List<ReqDocumentoResponse>> listarPorPrograma(@PathVariable Long idPrograma) {
        List<ReqDocumentoResponse> lista = reqDocumentoService.listarPorPrograma(idPrograma).stream()
                .map(r -> ReqDocumentoResponse.builder()
                        .id(r.getId())
                        .idPrograma(r.getPrograma().getId())
                        .nombrePrograma(r.getPrograma().getNombre())
                        .nombreDocumento(r.getNombreDocumento())
                        .descripcion(r.getDescripcion())
                        .obligatorio(r.getObligatorio())
                        .tipoPermitido(r.getTipoPermitido())
                        .build())
                .toList();
        return ResponseEntity.ok(lista);
    }
}
