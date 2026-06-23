package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.ListaNegra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListaNegraRepository extends JpaRepository<ListaNegra, Long> {

    List<ListaNegra> findByCiPostulanteAndActivoTrue(String ciPostulante);

    boolean existsByCiPostulanteAndActivoTrue(String ciPostulante);
}