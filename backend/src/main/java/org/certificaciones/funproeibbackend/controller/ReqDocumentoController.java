package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.ReqDocumentoRequest;
import org.certificaciones.funproeibbackend.dto.ReqDocumentoResponse;
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
        return ResponseEntity.status(HttpStatus.CREATED).body(reqDocumentoService.crear(request));
    }

    @GetMapping("/programa/{idPrograma}")
    public ResponseEntity<List<ReqDocumentoResponse>> listarPorPrograma(@PathVariable Long idPrograma) {
        return ResponseEntity.ok(reqDocumentoService.listarPorPrograma(idPrograma));
    }
}
