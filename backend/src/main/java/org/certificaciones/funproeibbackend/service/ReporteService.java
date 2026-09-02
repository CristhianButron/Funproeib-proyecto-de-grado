package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.InscritoReporteResponse;
import org.certificaciones.funproeibbackend.dto.ReporteInscritosFiltro;

import java.util.List;

public interface ReporteService {
    List<InscritoReporteResponse> listarInscritos(ReporteInscritosFiltro filtro);
}
