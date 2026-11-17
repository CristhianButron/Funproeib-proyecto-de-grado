package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.service.impl.EmailServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@DisplayName("EmailService - envío real (API de Resend) vs. modo simulado")
class EmailServiceImplTest {

    private EmailServiceImpl crearServicio(MockRestServiceServer[] serverOut, boolean mailEnabled, String apiKey) {
        RestClient.Builder builder = RestClient.builder();
        serverOut[0] = MockRestServiceServer.bindTo(builder).build();
        return new EmailServiceImpl(builder, mailEnabled, apiKey, "no-responder@funproeib.org", "http://localhost:4200");
    }

    @Test
    @DisplayName("Con app.mail.enabled=false no llama a la API de Resend, aunque haya API key")
    void enviarVerificacion_mailDeshabilitado_noEnvia() {
        MockRestServiceServer[] serverRef = new MockRestServiceServer[1];
        EmailServiceImpl service = crearServicio(serverRef, false, "re_test_key");

        service.enviarVerificacionCuenta("ana@correo.com", "Ana", "token-123", "Temporal123");

        serverRef[0].verify();
    }

    @Test
    @DisplayName("Sin API key configurada no llama a Resend ni falla, aunque app.mail.enabled=true")
    void enviarVerificacion_sinApiKey_noFalla() {
        MockRestServiceServer[] serverRef = new MockRestServiceServer[1];
        EmailServiceImpl service = crearServicio(serverRef, true, "");

        service.enviarVerificacionCuenta("ana@correo.com", "Ana", "token-123", "Temporal123");

        serverRef[0].verify();
    }

    @Test
    @DisplayName("Con app.mail.enabled=true y API key, llama a la API de Resend con el token correcto")
    void enviarVerificacion_mailHabilitado_llamaApiResend() {
        MockRestServiceServer[] serverRef = new MockRestServiceServer[1];
        EmailServiceImpl service = crearServicio(serverRef, true, "re_test_key");
        serverRef[0].expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer re_test_key"))
                .andRespond(withSuccess());

        service.enviarVerificacionCuenta("ana@correo.com", "Ana", "token-123", "Temporal123");

        serverRef[0].verify();
    }

    @Test
    @DisplayName("Si Resend responde con error, no se propaga la excepción (solo se registra)")
    void enviarVerificacion_resendFalla_noPropagaExcepcion() {
        MockRestServiceServer[] serverRef = new MockRestServiceServer[1];
        EmailServiceImpl service = crearServicio(serverRef, true, "re_test_key");
        serverRef[0].expect(requestTo("https://api.resend.com/emails"))
                .andRespond(withServerError());

        service.enviarVerificacionCuenta("ana@correo.com", "Ana", "token-123", "Temporal123");
        // No debe lanzar excepción.
    }

    @Test
    @DisplayName("Recuperación de contraseña: con app.mail.enabled=false no llama a Resend")
    void enviarRecuperacion_mailDeshabilitado_noEnvia() {
        MockRestServiceServer[] serverRef = new MockRestServiceServer[1];
        EmailServiceImpl service = crearServicio(serverRef, false, "re_test_key");

        service.enviarRecuperacionPassword("ana@correo.com", "Ana", "token-456");

        serverRef[0].verify();
    }

    @Test
    @DisplayName("Recuperación de contraseña: con app.mail.enabled=true y API key, llama a Resend")
    void enviarRecuperacion_mailHabilitado_llamaApiResend() {
        MockRestServiceServer[] serverRef = new MockRestServiceServer[1];
        EmailServiceImpl service = crearServicio(serverRef, true, "re_test_key");
        serverRef[0].expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess());

        service.enviarRecuperacionPassword("ana@correo.com", "Ana", "token-456");

        serverRef[0].verify();
    }
}
