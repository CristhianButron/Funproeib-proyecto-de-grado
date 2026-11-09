package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.EstadoCivil;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

/**
 * Datos que cada usuario puede editar de su propio perfil. No incluye correo
 * (cambiarlo requeriría una nueva verificación) ni contraseña (tiene su
 * propio flujo en CambiarPasswordRequest).
 */
@Data
public class UsuarioActualizarRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 80)
    private String nombre;

    @NotBlank(message = "El apellido paterno es obligatorio")
    @Size(max = 80)
    private String apellidoPaterno;

    @Size(max = 80)
    private String apellidoMaterno;

    @NotBlank(message = "El CI es obligatorio")
    @Size(max = 20)
    @Pattern(regexp = "^[0-9]+$", message = "El CI debe contener solo números")
    private String ci;

    @Size(max = 10)
    private String ciExtension;

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

    private List<@NotBlank @Size(max = 150) String> carreras;
}
