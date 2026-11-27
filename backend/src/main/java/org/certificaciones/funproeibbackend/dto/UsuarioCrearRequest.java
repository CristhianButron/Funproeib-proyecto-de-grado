package org.certificaciones.funproeibbackend.dto;

import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Datos para que un ADMIN cree una cuenta directamente (sin el flujo de
 * autoregistro con carnet ni verificación de correo): la cuenta queda activa
 * de inmediato, con una contraseña temporal que debe cambiar en su primer
 * ingreso (ver CambiarPasswordObligatorioRequest).
 */
@Data
public class UsuarioCrearRequest {

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

    @NotBlank(message = "El CI es obligatorio")
    @Size(max = 20)
    @Pattern(regexp = "^[0-9]+$", message = "El CI debe contener solo números")
    private String ci;

    @Size(max = 10)
    private String ciExtension;

    @NotNull(message = "El rol es obligatorio")
    private RolUsuario rol;
}
