package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.EstadoCivil;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class UsuarioResponse {
    private Long id;
    private String nombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
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
    private Long idCiudad;
    private String ciudad;
    private Long idPais;
    private String pais;
    private String telefono;
    private EstadoCivil estadoCivil;
    private String provinciaNacimiento;
    private String direccionDomicilio;
    private List<String> carreras;
}
