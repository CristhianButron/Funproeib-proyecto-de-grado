package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.ListaNegra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ListaNegraRepository extends JpaRepository<ListaNegra, Long> {

    // JOIN FETCH registradoPor: mapToResponse siempre lee su nombreCompleto
    // (LAZY); sin el fetch, cada fila de la lista dispara una consulta extra.
    @Query("SELECT ln FROM ListaNegra ln JOIN FETCH ln.registradoPor WHERE ln.activo = true")
    List<ListaNegra> findByActivoTrue();

    List<ListaNegra> findByCiPostulanteAndActivoTrue(String ciPostulante);

    boolean existsByCiPostulanteAndActivoTrue(String ciPostulante);
}