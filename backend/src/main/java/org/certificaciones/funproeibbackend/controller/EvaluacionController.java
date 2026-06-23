package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.EvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.EvaluacionResponse;
import org.certificaciones.funproeibbackend.service.EvaluacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evaluaciones")
@RequiredArgsConstructor
public class EvaluacionController {

    private final EvaluacionService evaluacionService;

    @PostMapping
    public ResponseEntity<EvaluacionResponse> evaluar(@Valid @RequestBody EvaluacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evaluacionService.evaluar(request));
    }

    @GetMapping("/postulacion/{idPostulacion}")
    public ResponseEntity<EvaluacionResponse> obtenerPorPostulacion(@PathVariable Long idPostulacion) {
        return ResponseEntity.ok(evaluacionService.obtenerPorPostulacion(idPostulacion));
    }
}
