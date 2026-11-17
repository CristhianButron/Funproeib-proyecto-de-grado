package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/**
 * Envía correos reales solo cuando app.mail.enabled=true y hay una API key de
 * Resend configurada. Mientras no, el correo se escribe en el log para poder
 * seguir el flujo en desarrollo sin depender de un proveedor real.
 *
 * Se usa la API HTTP de Resend (no SMTP) a propósito: varios hosts gratuitos
 * (Render incluido) bloquean las conexiones salientes por los puertos SMTP
 * (25/465/587) para evitar spam, así que un JavaMailSender ahí nunca llega a
 * conectar. La API HTTP va por el puerto 443 como cualquier otra petición web,
 * así que sí funciona.
 *
 * @Async en los dos métodos: el envío es una llamada a un servicio externo
 * que puede tardar o fallar; sin esto, quien llama (registrar, reenviar
 * verificación, recuperar contraseña) se queda esperando esa respuesta HTTP
 * en vez de recibir la suya de inmediato.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final RestClient restClient;
    private final boolean mailEnabled;
    private final String resendApiKey;
    private final String remitente;
    private final String frontendUrl;

    public EmailServiceImpl(
            RestClient.Builder restClientBuilder,
            @Value("${app.mail.enabled:false}") boolean mailEnabled,
            @Value("${app.mail.resend.api-key:}") String resendApiKey,
            @Value("${app.mail.remitente:no-responder@funproeib.org}") String remitente,
            @Value("${app.frontend.url:http://localhost:4200}") String frontendUrl) {
        this.restClient = restClientBuilder.build();
        this.mailEnabled = mailEnabled;
        this.resendApiKey = resendApiKey;
        this.remitente = remitente;
        this.frontendUrl = frontendUrl;
    }

    @Override
    @Async
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

        enviar(destinatario, asunto, cuerpo);
    }

    @Override
    @Async
    public void enviarRecuperacionPassword(String destinatario, String nombre, String tokenRecuperacion) {
        String enlace = frontendUrl + "/restablecer-password?token=" + tokenRecuperacion;
        String asunto = "Recupera tu contraseña - Funproeib Andes";
        String cuerpo = """
                Hola %s,

                Recibimos una solicitud para restablecer tu contraseña en el sistema de Funproeib Andes.

                Si fuiste tú, ingresa al siguiente enlace para definir una nueva contraseña:
                %s

                Este enlace vence en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo:
                tu contraseña actual seguirá funcionando con normalidad.
                """.formatted(nombre, enlace);

        enviar(destinatario, asunto, cuerpo);
    }

    private void enviar(String destinatario, String asunto, String cuerpoTexto) {
        if (!mailEnabled || resendApiKey.isBlank()) {
            log.info("[EMAIL SIMULADO - app.mail.enabled=false o sin API key de Resend] Para: {} | Asunto: {}\n{}",
                    destinatario, asunto, cuerpoTexto);
            return;
        }

        try {
            restClient.post()
                    .uri(RESEND_API_URL)
                    .header("Authorization", "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", remitente,
                            "to", List.of(destinatario),
                            "subject", asunto,
                            "text", cuerpoTexto))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Correo enviado a {} vía Resend", destinatario);
        } catch (RestClientException e) {
            log.error("No se pudo enviar el correo a {} vía Resend", destinatario, e);
        }
    }
}
