package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * A diferencia de CambiarPasswordRequest, este no pide la contraseña actual:
 * es solo para el cambio obligatorio del primer ingreso (con la contraseña
 * temporal), donde la persona ya la escribió segundos antes para loguearse
 * -volver a pedírsela ahí es una fricción sin ganancia real de seguridad,
 * porque el JWT ya prueba que la sabe-. UsuarioServiceImpl exige que
 * debeCambiarPassword esté en true antes de aceptar este cambio.
 */
@Data
public class CambiarPasswordObligatorioRequest {

    @NotNull(message = "El usuario es obligatorio")
    private Long idUsuario;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 8, message = "La nueva contraseña debe tener al menos 8 caracteres")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).*$",
            message = "La nueva contraseña debe combinar mayúscula, número y símbolo")
    private String contrasenaNueva;
}
