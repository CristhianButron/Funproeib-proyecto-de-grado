package org.certificaciones.funproeibbackend.util;

/**
 * Reglas de validación compartidas entre varios DTOs (en vez de repetir el
 * mismo regex/mensaje en cada uno).
 */
public final class ValidacionConstantes {

    private ValidacionConstantes() {
    }

    public static final String REGEX_PASSWORD_SEGURA = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).*$";
    public static final String MENSAJE_PASSWORD_SEGURA = "La nueva contraseña debe combinar mayúscula, número y símbolo";
}
