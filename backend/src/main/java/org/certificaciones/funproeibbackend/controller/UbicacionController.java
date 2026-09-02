package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.CiudadResponse;
import org.certificaciones.funproeibbackend.dto.PaisResponse;
import org.certificaciones.funproeibbackend.service.UbicacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ubicaciones")
@RequiredArgsConstructor
public class UbicacionController {

    private final UbicacionService ubicacionService;

    @GetMapping("/paises")
    public ResponseEntity<List<PaisResponse>> listarPaises() {
        return ResponseEntity.ok(ubicacionService.listarPaises());
    }

    @GetMapping("/paises/{idPais}/ciudades")
    public ResponseEntity<List<CiudadResponse>> listarCiudades(@PathVariable Long idPais) {
        return ResponseEntity.ok(ubicacionService.listarCiudadesPorPais(idPais));
    }
}
