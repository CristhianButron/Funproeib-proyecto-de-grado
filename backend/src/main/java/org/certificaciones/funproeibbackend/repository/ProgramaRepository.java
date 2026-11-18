package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ProgramaRepository extends JpaRepository<Programa, Long> {

    List<Programa> findByEstado(EstadoPrograma estado);

    List<Programa> findByNombreContainingIgnoreCase(String nombre);

    List<Programa> findByFechaFinBeforeAndEstadoNot(LocalDate fecha, EstadoPrograma estado);

    // Bloquea la fila del programa (SELECT ... FOR UPDATE) mientras dura la
    // transacción, para que dos postulaciones simultáneas al mismo programa
    // no puedan contar cupos disponibles con el mismo número "viejo" y las
    // dos pasen la validación (ver PostulacionServiceImpl.crear). Solo se usa
    // ahí, no en lecturas normales, porque serializa a quien compita por esa
    // fila.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Programa p where p.id = :id")
    Optional<Programa> findByIdParaActualizar(Long id);
}