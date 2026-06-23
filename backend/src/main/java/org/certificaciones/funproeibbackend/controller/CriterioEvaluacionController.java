package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;
import org.certificaciones.funproeibbackend.service.CriterioEvaluacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/criterios")
@RequiredArgsConstructor
public class CriterioEvaluacionController {

    private final CriterioEvaluacionService criterioService;

    @PostMapping
    public ResponseEntity<CriterioEvaluacionResponse> crear(@Valid @RequestBody CriterioEvaluacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(criterioService.crear(request));
    }

    @GetMapping("/programa/{idPrograma}")
    public ResponseEntity<List<CriterioEvaluacionResponse>> listarPorPrograma(@PathVariable Long idPrograma) {
        return ResponseEntity.ok(criterioService.listarPorPrograma(idPrograma));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        criterioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
