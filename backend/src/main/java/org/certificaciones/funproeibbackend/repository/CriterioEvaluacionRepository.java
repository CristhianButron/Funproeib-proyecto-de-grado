package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.CriterioEvaluacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CriterioEvaluacionRepository extends JpaRepository<CriterioEvaluacion, Long> {

    List<CriterioEvaluacion> findByProgramaId(Long idPrograma);
}