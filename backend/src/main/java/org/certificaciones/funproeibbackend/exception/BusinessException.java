package org.certificaciones.funproeibbackend.exception;

// Para reglas de negocio violadas (ej: postulante en lista negra, cupos agotados)
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}