package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Evaluacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {

    Optional<Evaluacion> findByPostulacionId(Long idPostulacion);

    boolean existsByPostulacionId(Long idPostulacion);
}