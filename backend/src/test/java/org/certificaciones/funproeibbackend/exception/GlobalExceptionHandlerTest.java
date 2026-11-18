package org.certificaciones.funproeibbackend.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("GlobalExceptionHandler - mapeo de excepciones a códigos HTTP")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // Sin un @ExceptionHandler específico para AccessDeniedException (lo que
    // lanza @PreAuthorize al denegar), este caía en el catch-all genérico y
    // respondía 500 en vez de 403 -el bug real que mostró
    // DocumentoRespuestaAutorizacionIntegrationTest al probar la autorización
    // por dueño del recurso contra la aplicación real.
    @Test
    @DisplayName("AccessDeniedException responde 403, no el 500 genérico")
    void accessDeniedException_responde403() {
        ResponseEntity<Map<String, Object>> res = handler.handleAccessDenied(new AccessDeniedException("denegado"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(res.getBody()).containsEntry("status", 403);
    }

    @Test
    @DisplayName("Una excepción no mapeada explícitamente sigue respondiendo 500 genérico")
    void excepcionNoMapeada_responde500() {
        ResponseEntity<Map<String, Object>> res = handler.handleGeneral(new RuntimeException("algo raro"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
