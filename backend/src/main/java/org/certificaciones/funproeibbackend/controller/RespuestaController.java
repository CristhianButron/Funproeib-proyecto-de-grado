package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.RespuestaRequest;
import org.certificaciones.funproeibbackend.dto.RespuestaResponse;
import org.certificaciones.funproeibbackend.service.RespuestaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/respuestas")
@RequiredArgsConstructor
public class RespuestaController {

    private final RespuestaService respuestaService;

    @PostMapping
    public ResponseEntity<RespuestaResponse> guardar(@Valid @RequestBody RespuestaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(respuestaService.guardar(request));
    }

    @GetMapping("/postulacion/{idPostulacion}")
    public ResponseEntity<List<RespuestaResponse>> listarPorPostulacion(@PathVariable Long idPostulacion) {
        return ResponseEntity.ok(respuestaService.listarPorPostulacion(idPostulacion));
    }
}
