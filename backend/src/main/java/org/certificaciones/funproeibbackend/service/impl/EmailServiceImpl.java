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
        String asunto = "Verifica tu cuenta - FUNPROEIB ANDES";
        String cuerpo = """
                Hola %s,

                Gracias por registrarte en el sistema de FUNPROEIB ANDES.

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

    @Override
    public void enviarRecuperacionPassword(String destinatario, String nombre, String tokenRecuperacion) {
        String enlace = frontendUrl + "/restablecer-password?token=" + tokenRecuperacion;
        String asunto = "Recupera tu contraseña - FUNPROEIB ANDES";
        String cuerpo = """
                Hola %s,

                Recibimos una solicitud para restablecer tu contraseña en el sistema de FUNPROEIB ANDES.

                Si fuiste tú, ingresa al siguiente enlace para definir una nueva contraseña:
                %s

                Este enlace vence en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo:
                tu contraseña actual seguirá funcionando con normalidad.
                """.formatted(nombre, enlace);

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
        log.info("Correo de recuperación de contraseña enviado a {}", destinatario);
    }

    @Override
    public void enviarCuentaCreadaPorAdmin(String destinatario, String nombre, String contrasenaTemporal) {
        String asunto = "Se creó tu cuenta - FUNPROEIB ANDES";
        String cuerpo = """
                Hola %s,

                Un administrador creó una cuenta para vos en el sistema de FUNPROEIB ANDES.

                Tu contraseña temporal es: %s

                Inicia sesión con tu correo y esta contraseña; el sistema te pedirá que la
                cambies por una nueva en tu primer ingreso.
                """.formatted(nombre, contrasenaTemporal);

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
        log.info("Correo de cuenta creada por administrador enviado a {}", destinatario);
    }

    @Override
    public void enviarRechazoIdentidad(String destinatario, String nombre) {
        String asunto = "Tu cuenta fue dada de baja - FUNPROEIB ANDES";
        String cuerpo = """
                Hola %s,

                Al revisar los documentos de identidad que cargaste en tu postulación,
                no pudimos verificar que correspondan a un carnet de identidad válido.

                Por este motivo, y por tratarse de un intento de falsificación de
                identidad, tu cuenta y tu postulación fueron dadas de baja del sistema
                de FUNPROEIB ANDES.

                Si consideras que esto es un error, puedes contactarte con el equipo de
                FUNPROEIB ANDES para aclararlo.
                """.formatted(nombre);

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
        log.info("Correo de rechazo de identidad enviado a {}", destinatario);
    }
}
