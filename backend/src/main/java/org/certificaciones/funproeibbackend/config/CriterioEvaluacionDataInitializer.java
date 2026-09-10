package org.certificaciones.funproeibbackend.config;

import org.certificaciones.funproeibbackend.model.CriterioEvaluacion;
import org.certificaciones.funproeibbackend.repository.CriterioEvaluacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Siembra el catálogo fijo de 6 criterios de evaluación de postulaciones,
 * estandarizado según el documento "Criterios de evaluación de postulaciones"
 * de Funproeib Andes (grilla propuesta: cada criterio se califica de 1 a 10,
 * puntaje total sobre 60).
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class CriterioEvaluacionDataInitializer implements CommandLineRunner {

    private final CriterioEvaluacionRepository criterioRepository;

    private static final List<CriterioEvaluacion> CRITERIOS = List.of(
            CriterioEvaluacion.builder().orden(1).nombreCriterio("Perfil y trayectoria del/la postulante")
                    .descripcion("Formación, experiencia laboral, educativa, comunitaria u organizativa relacionada con los objetivos del programa al que postula.")
                    .build(),
            CriterioEvaluacion.builder().orden(2).nombreCriterio("Motivación y expectativas")
                    .descripcion("Claridad de las razones para participar, expectativas de aprendizaje y relación con sus necesidades personales, profesionales o comunitarias.")
                    .build(),
            CriterioEvaluacion.builder().orden(3).nombreCriterio("Aplicación e incidencia")
                    .descripcion("Posibilidades de aplicar los conocimientos adquiridos y contribuir en su comunidad, unidad educativa, organización, institución o territorio.")
                    .build(),
            CriterioEvaluacion.builder().orden(4).nombreCriterio("Compromiso y disponibilidad")
                    .descripcion("Disponibilidad para participar en las actividades, cumplir las tareas y concluir satisfactoriamente el programa.")
                    .build(),
            CriterioEvaluacion.builder().orden(5).nombreCriterio("Aval y respaldo organizativo/comunitario")
                    .descripcion("Existencia y pertinencia de carta de aval, respaldo de una organización, autoridad indígena, unidad educativa o institución correspondiente.")
                    .build(),
            CriterioEvaluacion.builder().orden(6).nombreCriterio("Dominio de lengua indígena (cuando corresponda)")
                    .descripcion("Nivel de comprensión, expresión oral, lectura o escritura de una lengua indígena pertinente al programa.")
                    .build()
    );

    @Override
    public void run(String... args) {
        if (criterioRepository.count() > 0) {
            return;
        }
        criterioRepository.saveAll(CRITERIOS);
        System.out.println(">>> Criterios de evaluación estandarizados sembrados (" + CRITERIOS.size() + " criterios)");
    }
}
