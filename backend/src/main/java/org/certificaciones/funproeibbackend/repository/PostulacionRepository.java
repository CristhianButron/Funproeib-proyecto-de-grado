package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PostulacionRepository extends JpaRepository<Postulacion, Long> {

    // JOIN FETCH usuario+programa: estas tres alimentan las listas de
    // Postulantes/Beneficiarios/Evaluaciones, donde mapToResponse siempre lee
    // nombreCompleto del usuario y nombre del programa (ambos LAZY). Sin el
    // fetch, cada fila dispara 2 consultas extra (N+1).
    @Query("SELECT p FROM Postulacion p JOIN FETCH p.usuario JOIN FETCH p.programa WHERE p.programa.id = :idPrograma")
    List<Postulacion> findByProgramaId(@Param("idPrograma") Long idPrograma);

    @Query("SELECT p FROM Postulacion p JOIN FETCH p.usuario JOIN FETCH p.programa WHERE p.usuario.id = :idUsuario")
    List<Postulacion> findByUsuarioId(@Param("idUsuario") Long idUsuario);

    @Query("SELECT p FROM Postulacion p JOIN FETCH p.usuario JOIN FETCH p.programa WHERE p.estado = :estado")
    List<Postulacion> findByEstado(@Param("estado") EstadoPostulacion estado);

    @Query("SELECT p FROM Postulacion p JOIN FETCH p.usuario u JOIN FETCH p.programa pr " +
            "WHERE p.estadoAprovechamiento = 'ABANDONO'")
    List<Postulacion> findConAbandono();

    @Query("SELECT p FROM Postulacion p WHERE p.usuario.ci = :ci AND p.estado IN :estados")
    List<Postulacion> findByUsuarioCiAndEstadoIn(@Param("ci") String ci, @Param("estados") List<EstadoPostulacion> estados);

    Optional<Postulacion> findByUsuarioIdAndProgramaId(Long idUsuario, Long idPrograma);

    boolean existsByUsuarioIdAndProgramaId(Long idUsuario, Long idPrograma);

    long countByProgramaIdAndEstadoNotIn(Long idPrograma, List<EstadoPostulacion> estados);

    long countByProgramaId(Long idPrograma);

    long countByProgramaIdAndEstado(Long idPrograma, EstadoPostulacion estado);

    // Versión en lote de las dos de arriba, para listarTodos(): una sola
    // consulta agrupada para todos los programas en vez de 2 consultas por
    // programa (N+1).
    @Query("SELECT p.programa.id, COUNT(p) FROM Postulacion p WHERE p.programa.id IN :idsProgramas GROUP BY p.programa.id")
    List<Object[]> contarPorPrograma(@Param("idsProgramas") List<Long> idsProgramas);

    @Query("SELECT p.programa.id, COUNT(p) FROM Postulacion p WHERE p.programa.id IN :idsProgramas AND p.estado = :estado GROUP BY p.programa.id")
    List<Object[]> contarPorProgramaYEstado(@Param("idsProgramas") List<Long> idsProgramas, @Param("estado") EstadoPostulacion estado);

    @Query("SELECT p FROM Postulacion p " +
            "JOIN FETCH p.programa pr " +
            "WHERE p.usuario.id = :idUsuario " +
            "AND p.estado = :estado " +
            "AND pr.tipo = :tipoPrograma")
    List<Postulacion> findByUsuarioIdAndEstadoAndProgramaTipo(
            @Param("idUsuario") Long idUsuario,
            @Param("estado") EstadoPostulacion estado,
            @Param("tipoPrograma") TipoPrograma tipoPrograma);

    /**
     * Beneficiarios reales: postulaciones ACEPTADAS a programas que ya
     * finalizaron (fecha_fin ya pasada). Alguien aceptado en un programa que
     * todavía está en curso no cuenta como beneficiario todavía; alguien
     * pendiente, rechazado o incompleto nunca cuenta. No es un filtro
     * opcional: es la definición misma del reporte.
     */
    @Query("SELECT p FROM Postulacion p " +
            "JOIN FETCH p.usuario u " +
            "JOIN FETCH p.programa pr " +
            "LEFT JOIN u.ciudad c " +
            "LEFT JOIN c.pais pa " +
            "WHERE p.estado = org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion.ACEPTADA " +
            "AND pr.fechaFin < CURRENT_DATE " +
            "AND (:tipoPrograma IS NULL OR pr.tipo = :tipoPrograma) " +
            "AND (:idPrograma IS NULL OR pr.id = :idPrograma) " +
            "AND (:genero IS NULL OR u.genero = :genero) " +
            "AND (:nivelEducativo IS NULL OR u.nivelEducativo = :nivelEducativo) " +
            "AND (:idPais IS NULL OR pa.id = :idPais) " +
            "AND (:idCiudad IS NULL OR c.id = :idCiudad) " +
            "AND pr.fechaFin >= COALESCE(:fechaDesde, pr.fechaFin) " +
            "AND pr.fechaFin <= COALESCE(:fechaHasta, pr.fechaFin) " +
            "ORDER BY pr.fechaFin DESC")
    List<Postulacion> buscarBeneficiarios(
            @Param("tipoPrograma") TipoPrograma tipoPrograma,
            @Param("idPrograma") Long idPrograma,
            @Param("genero") Genero genero,
            @Param("nivelEducativo") NivelEducativo nivelEducativo,
            @Param("idPais") Long idPais,
            @Param("idCiudad") Long idCiudad,
            @Param("fechaDesde") LocalDate fechaDesde,
            @Param("fechaHasta") LocalDate fechaHasta);
}