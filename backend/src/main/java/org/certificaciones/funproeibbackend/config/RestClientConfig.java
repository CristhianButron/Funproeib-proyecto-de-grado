package org.certificaciones.funproeibbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * El starter web de este proyecto no trae autoconfigurado un bean de
 * RestClient.Builder (eso vive en un módulo aparte), así que se declara acá
 * a mano para poder inyectarlo donde se necesite (por ahora, EmailServiceImpl
 * para llamar a la API de Resend).
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}
