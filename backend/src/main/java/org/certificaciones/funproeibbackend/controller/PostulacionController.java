package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.PostulacionRequest;
import org.certificaciones.funproeibbackend.dto.PostulacionResponse;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.service.PostulacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/postulaciones")
@RequiredArgsConstructor
public class PostulacionController {

    private final PostulacionService postulacionService;

    @PostMapping
    public ResponseEntity<PostulacionResponse> crear(@Valid @RequestBody PostulacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postulacionService.crear(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostulacionResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(postulacionService.obtenerPorId(id));
    }

    @GetMapping("/programa/{idPrograma}")
    public ResponseEntity<List<PostulacionResponse>> listarPorPrograma(@PathVariable Long idPrograma) {
        return ResponseEntity.ok(postulacionService.listarPorPrograma(idPrograma));
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<PostulacionResponse>> listarPorUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(postulacionService.listarPorUsuario(idUsuario));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<PostulacionResponse>> listarPorEstado(@PathVariable EstadoPostulacion estado) {
        return ResponseEntity.ok(postulacionService.listarPorEstado(estado));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<PostulacionResponse> cambiarEstado(
            @PathVariable Long id,
            @RequestParam EstadoPostulacion estado) {
        return ResponseEntity.ok(postulacionService.cambiarEstado(id, estado));
    }
}
