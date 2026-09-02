package org.certificaciones.funproeibbackend.config;

import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Pais;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.PaisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Siembra el catálogo de países y ciudades usado por el selector en cascada
 * del registro de postulantes. Corre antes que DataInitializer (que crea el
 * usuario admin referenciando una ciudad).
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class UbicacionDataInitializer implements CommandLineRunner {

    private final PaisRepository paisRepository;
    private final CiudadRepository ciudadRepository;

    private static final Map<String, List<String>> PAISES_Y_CIUDADES = Map.ofEntries(
            Map.entry("Bolivia", List.of("La Paz", "Santa Cruz de la Sierra", "Cochabamba", "Sucre", "Oruro", "Potosí", "Tarija", "Trinidad", "Cobija")),
            Map.entry("Perú", List.of("Lima", "Cusco", "Arequipa", "Puno", "Trujillo", "Iquitos")),
            Map.entry("Ecuador", List.of("Quito", "Guayaquil", "Cuenca", "Otavalo")),
            Map.entry("Colombia", List.of("Bogotá", "Medellín", "Cali", "Popayán")),
            Map.entry("Chile", List.of("Santiago", "Temuco", "Valparaíso")),
            Map.entry("Argentina", List.of("Buenos Aires", "Salta", "Jujuy", "Córdoba")),
            Map.entry("Brasil", List.of("São Paulo", "Río de Janeiro", "Brasília")),
            Map.entry("Paraguay", List.of("Asunción", "Ciudad del Este")),
            Map.entry("México", List.of("Ciudad de México", "Oaxaca", "Chiapas")),
            Map.entry("Guatemala", List.of("Ciudad de Guatemala", "Quetzaltenango"))
    );

    @Override
    public void run(String... args) {
        if (paisRepository.count() > 0) {
            return;
        }
        PAISES_Y_CIUDADES.forEach((nombrePais, ciudades) -> {
            Pais pais = paisRepository.save(Pais.builder().nombre(nombrePais).build());
            ciudades.forEach(nombreCiudad ->
                    ciudadRepository.save(Ciudad.builder().nombre(nombreCiudad).pais(pais).build()));
        });
        System.out.println(">>> Catálogo de países y ciudades sembrado (" + PAISES_Y_CIUDADES.size() + " países)");
    }
}
