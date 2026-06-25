package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.RespuestaPostulacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RespuestaPostulacionRepository extends JpaRepository<RespuestaPostulacion, Long> {
    List<RespuestaPostulacion> findByPostulacionId(Long idPostulacion);
    Optional<RespuestaPostulacion> findByPostulacionIdAndPreguntaId(Long idPostulacion, Long idPregunta);
}
