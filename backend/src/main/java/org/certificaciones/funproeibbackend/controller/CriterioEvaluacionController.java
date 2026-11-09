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

/**
 * Catálogo de criterios de evaluación de postulaciones (ver
 * CriterioEvaluacion). El administrador puede agregar un criterio nuevo o
 * editar/desactivar uno existente; el puntaje de la evaluación se reajusta
 * automáticamente para seguir sumando 100 sin importar cuántos haya activos.
 */
@RestController
@RequestMapping("/api/criterios")
@RequiredArgsConstructor
public class CriterioEvaluacionController {

    private final CriterioEvaluacionService criterioService;

    @GetMapping
    public ResponseEntity<List<CriterioEvaluacionResponse>> listarTodos() {
        return ResponseEntity.ok(criterioService.listarTodos());
    }

    @GetMapping("/activos")
    public ResponseEntity<List<CriterioEvaluacionResponse>> listarActivos() {
        return ResponseEntity.ok(criterioService.listarActivos());
    }

    @PostMapping
    public ResponseEntity<CriterioEvaluacionResponse> crear(@Valid @RequestBody CriterioEvaluacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(criterioService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CriterioEvaluacionResponse> actualizar(@PathVariable Long id, @Valid @RequestBody CriterioEvaluacionRequest request) {
        return ResponseEntity.ok(criterioService.actualizar(id, request));
    }

    @PatchMapping("/{id}/activo")
    public ResponseEntity<CriterioEvaluacionResponse> cambiarActivo(@PathVariable Long id, @RequestParam boolean activo) {
        return ResponseEntity.ok(criterioService.cambiarActivo(id, activo));
    }
}
