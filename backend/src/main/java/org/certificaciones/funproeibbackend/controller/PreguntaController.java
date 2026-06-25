package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.PreguntaRequest;
import org.certificaciones.funproeibbackend.dto.PreguntaResponse;
import org.certificaciones.funproeibbackend.service.PreguntaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/preguntas")
@RequiredArgsConstructor
public class PreguntaController {

    private final PreguntaService preguntaService;

    @PostMapping
    public ResponseEntity<PreguntaResponse> crear(@Valid @RequestBody PreguntaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(preguntaService.crear(request));
    }

    @GetMapping("/programa/{idPrograma}")
    public ResponseEntity<List<PreguntaResponse>> listarPorPrograma(@PathVariable Long idPrograma) {
        return ResponseEntity.ok(preguntaService.listarPorPrograma(idPrograma));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        preguntaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
