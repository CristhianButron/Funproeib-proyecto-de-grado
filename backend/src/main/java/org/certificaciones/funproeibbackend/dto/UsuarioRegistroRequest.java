package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.EstadoCivil;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class UsuarioRegistroRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 80)
    private String nombre;

    @NotBlank(message = "El apellido paterno es obligatorio")
    @Size(max = 80)
    private String apellidoPaterno;

    @Size(max = 80)
    private String apellidoMaterno;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato válido")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String contrasena;

    @NotBlank(message = "El CI es obligatorio")
    @Size(max = 20)
    private String ci;

    // Perfil del postulante
    @NotNull(message = "El género es obligatorio")
    private Genero genero;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    @Past(message = "La fecha de nacimiento debe ser una fecha pasada")
    private LocalDate fechaNacimiento;

    private String autoidentificacionEtnica;

    @NotNull(message = "El nivel educativo es obligatorio")
    private NivelEducativo nivelEducativo;

    @NotNull(message = "La ciudad actual de residencia es obligatoria")
    private Long idCiudad;

    private String telefono;

    @NotNull(message = "El estado civil es obligatorio")
    private EstadoCivil estadoCivil;

    @NotNull(message = "La ciudad de nacimiento es obligatoria")
    private Long idCiudadNacimiento;

    @Size(max = 100)
    private String provinciaNacimiento;

    @Size(max = 255)
    private String direccionDomicilio;

    /**
     * Carreras o profesiones del postulante. Se exige al menos una cuando el
     * nivel educativo declarado es superior a secundaria (validado en el servicio,
     * ya que depende del valor de otro campo).
     */
    private List<@NotBlank @Size(max = 150) String> carreras;
}
