package org.certificaciones.funproeibbackend.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CorreoDesechableValidator")
class CorreoDesechableValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "persona@mailinator.com", "persona@guerrillamail.com", "persona@10minutemail.com",
            "persona@yopmail.com", "PERSONA@MAILINATOR.COM",
    })
    @DisplayName("Reconoce dominios de correo temporal conocidos (sin distinguir mayúsculas)")
    void esDesechable_dominioConocido_devuelveTrue(String correo) {
        assertThat(CorreoDesechableValidator.esDesechable(correo)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"persona@gmail.com", "persona@ucb.edu.bo", "persona@funproeib.org"})
    @DisplayName("No marca como desechable un correo de un proveedor normal")
    void esDesechable_dominioNormal_devuelveFalse(String correo) {
        assertThat(CorreoDesechableValidator.esDesechable(correo)).isFalse();
    }

    @Test
    @DisplayName("Devuelve false ante entradas nulas o sin arroba")
    void esDesechable_entradaInvalida_devuelveFalse() {
        assertThat(CorreoDesechableValidator.esDesechable(null)).isFalse();
        assertThat(CorreoDesechableValidator.esDesechable("sin-arroba")).isFalse();
    }
}
