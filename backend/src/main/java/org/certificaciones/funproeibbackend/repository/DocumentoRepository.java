package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Documento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {

    List<Documento> findByPostulacionId(Long idPostulacion);

    List<Documento> findByPostulacionIdAndVerificadoFalse(Long idPostulacion);
}