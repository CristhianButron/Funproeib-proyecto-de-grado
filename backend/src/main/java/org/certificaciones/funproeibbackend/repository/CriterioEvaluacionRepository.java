package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.CriterioEvaluacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CriterioEvaluacionRepository extends JpaRepository<CriterioEvaluacion, Long> {

    List<CriterioEvaluacion> findAllByOrderByOrdenAsc();

    List<CriterioEvaluacion> findByActivoTrueOrderByOrdenAsc();

    long countByActivoTrue();

    Optional<CriterioEvaluacion> findFirstByOrderByOrdenDesc();

    boolean existsByNombreCriterioIgnoreCase(String nombreCriterio);
}
