package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.ProgramaRequest;
import org.certificaciones.funproeibbackend.dto.ProgramaResponse;
import org.certificaciones.funproeibbackend.service.ProgramaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/programas")
@RequiredArgsConstructor
public class ProgramaController {

    private final ProgramaService programaService;

    @PostMapping
    public ResponseEntity<ProgramaResponse> crear(@Valid @RequestBody ProgramaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(programaService.crear(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProgramaResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(programaService.obtenerPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<ProgramaResponse>> listarTodos() {
        return ResponseEntity.ok(programaService.listarTodos());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProgramaResponse> actualizar(@PathVariable Long id, @Valid @RequestBody ProgramaRequest request) {
        return ResponseEntity.ok(programaService.actualizar(id, request));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<ProgramaResponse> cambiarEstado(@PathVariable Long id, @RequestParam String estado) {
        return ResponseEntity.ok(programaService.cambiarEstado(id, estado));
    }
}
