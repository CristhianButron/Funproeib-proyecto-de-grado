package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class UsuarioResponse {
    private Long id;
    private String nombreCompleto;
    private String correo;
    private String ci;
    private RolUsuario rol;
    private LocalDate fechaRegistro;
    private Boolean activo;

    // Perfil del postulante
    private Genero genero;
    private LocalDate fechaNacimiento;
    private Integer edad;
    private String autoidentificacionEtnica;
    private NivelEducativo nivelEducativo;
    private String paisOrigen;
    private String departamentoOrigen;
    private String municipioOrigen;
    private String telefono;
}
