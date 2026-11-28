package org.certificaciones.funproeibbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.certificaciones.funproeibbackend.util.ValidacionConstantes;

@Data
public class RestablecerPasswordRequest {

    @NotBlank(message = "El token es obligatorio")
    private String token;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 8, message = "La nueva contraseña debe tener al menos 8 caracteres")
    @Pattern(regexp = ValidacionConstantes.REGEX_PASSWORD_SEGURA,
            message = ValidacionConstantes.MENSAJE_PASSWORD_SEGURA)
    private String contrasenaNueva;
}
