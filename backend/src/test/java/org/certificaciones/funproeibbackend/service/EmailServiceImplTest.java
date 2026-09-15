package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.service.impl.EmailServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService - envío real vs. modo simulado")
class EmailServiceImplTest {

    @Mock private JavaMailSender mailSender;

    @Test
    @DisplayName("Con app.mail.enabled=false no intenta enviar, aunque haya un JavaMailSender disponible")
    void enviarVerificacion_mailDeshabilitado_noEnvia() {
        EmailServiceImpl service = new EmailServiceImpl(Optional.of(mailSender), false, "no-responder@funproeib.org", "http://localhost:4200");

        service.enviarVerificacionCuenta("ana@correo.com", "Ana", "token-123", "Temporal123");

        verifyNoInteractions(mailSender);
    }

    @Test
    @DisplayName("Sin JavaMailSender configurado no falla, aunque app.mail.enabled=true")
    void enviarVerificacion_sinMailSender_noFalla() {
        EmailServiceImpl service = new EmailServiceImpl(Optional.empty(), true, "no-responder@funproeib.org", "http://localhost:4200");

        service.enviarVerificacionCuenta("ana@correo.com", "Ana", "token-123", "Temporal123");
        // No debe lanzar excepción: simplemente registra el correo en el log.
    }

    @Test
    @DisplayName("Con app.mail.enabled=true y JavaMailSender disponible, envía el correo")
    void enviarVerificacion_mailHabilitado_envia() {
        EmailServiceImpl service = new EmailServiceImpl(Optional.of(mailSender), true, "no-responder@funproeib.org", "http://localhost:4200");

        service.enviarVerificacionCuenta("ana@correo.com", "Ana", "token-123", "Temporal123");

        verify(mailSender).send(any(SimpleMailMessage.class));
    }
}
