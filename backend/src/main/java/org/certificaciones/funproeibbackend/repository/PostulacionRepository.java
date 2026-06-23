package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostulacionRepository extends JpaRepository<Postulacion, Long> {

    List<Postulacion> findByProgramaId(Long idPrograma);

    List<Postulacion> findByUsuarioId(Long idUsuario);

    List<Postulacion> findByEstado(EstadoPostulacion estado);

    Optional<Postulacion> findByUsuarioIdAndProgramaId(Long idUsuario, Long idPrograma);

    boolean existsByUsuarioIdAndProgramaId(Long idUsuario, Long idPrograma);
}