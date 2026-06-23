package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.DetalleEvaluacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetalleEvaluacionRepository extends JpaRepository<DetalleEvaluacion, Long> {

    List<DetalleEvaluacion> findByEvaluacionId(Long idEvaluacion);
}