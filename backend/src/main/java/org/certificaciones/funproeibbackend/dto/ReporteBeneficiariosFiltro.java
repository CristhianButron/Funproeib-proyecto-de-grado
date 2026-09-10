package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import lombok.Data;

import java.time.LocalDate;

/**
 * Filtros del reporte de beneficiarios. No incluye "estado": el reporte
 * siempre son personas ACEPTADAS en programas ya finalizados (ver
 * PostulacionRepository.buscarBeneficiarios) — eso no se filtra, se define.
 * fechaDesde/fechaHasta acotan la fecha en que el programa finalizó.
 */
@Data
public class ReporteBeneficiariosFiltro {
    private TipoPrograma tipoPrograma;
    private Long idPrograma;
    private Genero genero;
    private NivelEducativo nivelEducativo;
    private Long idPais;
    private Long idCiudad;
    private LocalDate fechaDesde;
    private LocalDate fechaHasta;
}
