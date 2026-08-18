package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.InscritoReporteResponse;
import org.certificaciones.funproeibbackend.dto.ReporteInscritosFiltro;
import org.certificaciones.funproeibbackend.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/inscritos")
    public ResponseEntity<List<InscritoReporteResponse>> listarInscritos(@ModelAttribute ReporteInscritosFiltro filtro) {
        return ResponseEntity.ok(reporteService.listarInscritos(filtro));
    }

    @GetMapping("/paises")
    public ResponseEntity<List<String>> listarPaises() {
        return ResponseEntity.ok(reporteService.listarPaisesDisponibles());
    }

    @GetMapping("/departamentos")
    public ResponseEntity<List<String>> listarDepartamentos() {
        return ResponseEntity.ok(reporteService.listarDepartamentosDisponibles());
    }
}
