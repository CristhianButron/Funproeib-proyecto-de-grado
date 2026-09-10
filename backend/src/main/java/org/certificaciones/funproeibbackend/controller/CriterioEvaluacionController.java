package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;
import org.certificaciones.funproeibbackend.service.CriterioEvaluacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Catálogo fijo y estandarizado de criterios de evaluación de postulaciones
 * (ver CriterioEvaluacion). Es de solo lectura: los criterios se siembran una
 * vez al arrancar la aplicación y son los mismos para todos los programas.
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
}
