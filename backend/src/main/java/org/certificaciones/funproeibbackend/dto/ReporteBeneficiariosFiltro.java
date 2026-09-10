package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ReporteBeneficiariosFiltro {
    private TipoPrograma tipoPrograma;
    private Long idPrograma;
    private EstadoPostulacion estado;
    private Genero genero;
    private NivelEducativo nivelEducativo;
    private Long idPais;
    private Long idCiudad;
    private LocalDate fechaDesde;
    private LocalDate fechaHasta;
}
