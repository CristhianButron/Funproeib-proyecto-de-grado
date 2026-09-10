package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class BeneficiarioReporteResponse {
    private Long idPostulacion;
    private Long idUsuario;
    private String nombreCompleto;
    private String ci;
    private String correo;
    private String telefono;
    private Genero genero;
    private Integer edad;
    private LocalDate fechaNacimiento;
    private NivelEducativo nivelEducativo;
    private String autoidentificacionEtnica;
    private String pais;
    private String ciudad;

    private Long idPrograma;
    private String nombrePrograma;
    private TipoPrograma tipoPrograma;
    private String edicion;
    private LocalDate fechaPostulacion;
    private EstadoPostulacion estado;
}
