package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.BeneficiarioReporteResponse;
import org.certificaciones.funproeibbackend.dto.ReporteBeneficiariosFiltro;

import java.util.List;

public interface ReporteService {
    List<BeneficiarioReporteResponse> listarBeneficiarios(ReporteBeneficiariosFiltro filtro);
}
