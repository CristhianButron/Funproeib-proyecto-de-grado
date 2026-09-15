package org.certificaciones.funproeibbackend.service;

public interface EmailService {

    void enviarVerificacionCuenta(String destinatario, String nombre, String tokenVerificacion, String contrasenaTemporal);
}
