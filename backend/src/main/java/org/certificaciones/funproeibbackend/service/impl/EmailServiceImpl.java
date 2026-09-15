package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Envía correos reales solo cuando app.mail.enabled=true y hay un JavaMailSender
 * configurado (spring.mail.host presente). Mientras no haya SMTP configurado
 * (por ejemplo en desarrollo), el correo se escribe en el log para poder seguir
 * el flujo sin depender de un proveedor real.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final Optional<JavaMailSender> mailSender;
    private final boolean mailEnabled;
    private final String remitente;
    private final String frontendUrl;

    public EmailServiceImpl(
            Optional<JavaMailSender> mailSender,
            @Value("${app.mail.enabled:false}") boolean mailEnabled,
            @Value("${app.mail.remitente:no-responder@funproeib.org}") String remitente,
            @Value("${app.frontend.url:http://localhost:4200}") String frontendUrl) {
        this.mailSender = mailSender;
        this.mailEnabled = mailEnabled;
        this.remitente = remitente;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void enviarVerificacionCuenta(String destinatario, String nombre, String tokenVerificacion, String contrasenaTemporal) {
        String enlace = frontendUrl + "/verificar-correo?token=" + tokenVerificacion;
        String asunto = "Verifica tu cuenta - Funproeib Andes";
        String cuerpo = """
                Hola %s,

                Gracias por registrarte en el sistema de Funproeib Andes.

                Para activar tu cuenta, verifica tu correo electrónico ingresando al siguiente enlace:
                %s

                Tu contraseña temporal es: %s

                Una vez verificada tu cuenta, inicia sesión con esta contraseña; el sistema te pedirá
                que la cambies por una nueva en tu primer ingreso.

                Este enlace vence en 24 horas.
                """.formatted(nombre, enlace, contrasenaTemporal);

        if (!mailEnabled || mailSender.isEmpty()) {
            log.info("[EMAIL SIMULADO - app.mail.enabled=false o SMTP no configurado] Para: {} | Asunto: {}\n{}",
                    destinatario, asunto, cuerpo);
            return;
        }

        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject(asunto);
        mensaje.setText(cuerpo);
        mailSender.get().send(mensaje);
        log.info("Correo de verificación enviado a {}", destinatario);
    }
}
