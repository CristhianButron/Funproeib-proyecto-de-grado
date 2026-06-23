package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.ListaNegraRequest;
import org.certificaciones.funproeibbackend.dto.ListaNegraResponse;
import org.certificaciones.funproeibbackend.service.ListaNegraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lista-negra")
@RequiredArgsConstructor
public class ListaNegraController {

    private final ListaNegraService listaNegraService;

    @PostMapping
    public ResponseEntity<ListaNegraResponse> agregar(@Valid @RequestBody ListaNegraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(listaNegraService.agregar(request));
    }

    @GetMapping
    public ResponseEntity<List<ListaNegraResponse>> listarActivos() {
        return ResponseEntity.ok(listaNegraService.listarActivos());
    }

    @GetMapping("/verificar/{ci}")
    public ResponseEntity<Boolean> verificar(@PathVariable String ci) {
        return ResponseEntity.ok(listaNegraService.estaEnListaNegra(ci));
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<ListaNegraResponse> desactivar(@PathVariable Long id) {
        return ResponseEntity.ok(listaNegraService.desactivar(id));
    }
}
