package org.certificaciones.funproeibbackend.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Pais;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.PaisRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Siembra el catálogo de países y ciudades (divisiones administrativas de
 * primer nivel: departamento/provincia/estado, según el país) usado por el
 * selector en cascada del registro de postulantes y los filtros de reportes.
 *
 * Los datos vienen de src/main/resources/geodata/{countries,states}.json,
 * un extracto del dataset abierto countries-states-cities-database (dr5hn,
 * licencia ODbL — ver geodata/NOTICE.md), no de una lista escrita a mano.
 *
 * Corre antes que DataInitializer (que crea el usuario admin referenciando
 * una ciudad).
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class UbicacionDataInitializer implements CommandLineRunner {

    private final PaisRepository paisRepository;
    private final CiudadRepository ciudadRepository;

    @Override
    public void run(String... args) throws Exception {
        if (paisRepository.count() > 0) {
            return;
        }

        ObjectMapper mapper = new ObjectMapper();

        List<PaisJson> paisesJson;
        try (InputStream in = new ClassPathResource("geodata/countries.json").getInputStream()) {
            paisesJson = mapper.readValue(in, new TypeReference<>() {});
        }

        Map<Long, Pais> paisesPorIdExterno = new HashMap<>();
        for (PaisJson pJson : paisesJson) {
            Pais pais = paisRepository.save(Pais.builder().nombre(nombre(pJson.name, pJson.nameEs)).build());
            paisesPorIdExterno.put(pJson.id, pais);
        }

        List<CiudadJson> ciudadesJson;
        try (InputStream in = new ClassPathResource("geodata/states.json").getInputStream()) {
            ciudadesJson = mapper.readValue(in, new TypeReference<>() {});
        }

        List<Ciudad> ciudades = new ArrayList<>();
        for (CiudadJson cJson : ciudadesJson) {
            Pais pais = paisesPorIdExterno.get(cJson.countryId);
            if (pais == null) continue;
            ciudades.add(Ciudad.builder().nombre(nombre(cJson.name, cJson.nameEs)).pais(pais).build());
        }
        ciudadRepository.saveAll(ciudades);

        System.out.println(">>> Catálogo geográfico sembrado: " + paisesJson.size() + " países, " + ciudades.size() + " ciudades/regiones");
    }

    private String nombre(String original, String enEspanol) {
        return (enEspanol != null && !enEspanol.isBlank()) ? enEspanol : original;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PaisJson {
        private Long id;
        private String name;
        @JsonProperty("name_es")
        private String nameEs;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class CiudadJson {
        private Long id;
        private String name;
        @JsonProperty("country_id")
        private Long countryId;
        @JsonProperty("name_es")
        private String nameEs;
    }
}
