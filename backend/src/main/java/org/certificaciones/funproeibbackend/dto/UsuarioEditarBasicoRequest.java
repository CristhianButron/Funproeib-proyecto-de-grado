package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Edición rápida de datos básicos desde el panel de administración (Usuarios):
 * a diferencia de UsuarioActualizarRequest (perfil completo del postulante,
 * usado por "Mi perfil"), este cubre solo nombre/apellidos/CI y sirve para
 * cualquier rol, incluyendo cuentas de staff sin perfil de postulante.
 */
@Data
public class UsuarioEditarBasicoRequest {

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
}
