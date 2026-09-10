package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ProgramaRepository extends JpaRepository<Programa, Long> {

    List<Programa> findByEstado(EstadoPrograma estado);

    List<Programa> findByNombreContainingIgnoreCase(String nombre);

    List<Programa> findByFechaFinBeforeAndEstadoNot(LocalDate fecha, EstadoPrograma estado);
}