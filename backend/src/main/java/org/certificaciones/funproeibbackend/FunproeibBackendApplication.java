package org.certificaciones.funproeibbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FunproeibBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FunproeibBackendApplication.class, args);
    }

}
