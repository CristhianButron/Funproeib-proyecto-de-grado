package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.BeneficiarioReporteResponse;
import org.certificaciones.funproeibbackend.dto.ReporteBeneficiariosFiltro;
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

    @GetMapping("/beneficiarios")
    public ResponseEntity<List<BeneficiarioReporteResponse>> listarBeneficiarios(@ModelAttribute ReporteBeneficiariosFiltro filtro) {
        return ResponseEntity.ok(reporteService.listarBeneficiarios(filtro));
    }
}
