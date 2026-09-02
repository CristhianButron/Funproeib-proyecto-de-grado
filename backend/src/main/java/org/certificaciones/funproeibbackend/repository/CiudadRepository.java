package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Ciudad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CiudadRepository extends JpaRepository<Ciudad, Long> {

    List<Ciudad> findByPaisIdOrderByNombreAsc(Long idPais);

    Optional<Ciudad> findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase(String nombre, String nombrePais);
}
