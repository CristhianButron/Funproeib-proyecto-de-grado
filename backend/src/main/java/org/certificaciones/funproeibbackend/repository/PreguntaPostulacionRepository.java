package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.PreguntaPostulacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PreguntaPostulacionRepository extends JpaRepository<PreguntaPostulacion, Long> {
    List<PreguntaPostulacion> findByProgramaIdOrderByOrdenAsc(Long idPrograma);
}
