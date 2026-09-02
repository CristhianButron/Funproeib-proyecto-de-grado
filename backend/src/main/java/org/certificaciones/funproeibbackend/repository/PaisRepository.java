package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Pais;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaisRepository extends JpaRepository<Pais, Long> {

    List<Pais> findAllByOrderByNombreAsc();
}
