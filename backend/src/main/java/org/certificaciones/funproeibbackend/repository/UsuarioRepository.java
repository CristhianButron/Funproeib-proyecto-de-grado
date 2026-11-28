package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // LEFT JOIN FETCH (ciudad/ciudadNacimiento son opcionales) de ciudad+país:
    // mapToResponse en UsuarioServiceImpl siempre los lee (LAZY), así que sin
    // el fetch cada fila de la lista dispara hasta 4 consultas extra (N+1).
    @Query("SELECT u FROM Usuario u " +
            "LEFT JOIN FETCH u.ciudad c LEFT JOIN FETCH c.pais " +
            "LEFT JOIN FETCH u.ciudadNacimiento cn LEFT JOIN FETCH cn.pais")
    List<Usuario> findAllConUbicacion();

    Optional<Usuario> findByCorreo(String correo);

    Optional<Usuario> findByCi(String ci);

    List<Usuario> findByCiIn(List<String> cis);

    Optional<Usuario> findByTokenVerificacion(String tokenVerificacion);

    Optional<Usuario> findByTokenRecuperacion(String tokenRecuperacion);

    boolean existsByCorreo(String correo);

    boolean existsByCi(String ci);

    List<Usuario> findByRol(RolUsuario rol);

    List<Usuario> findByRolIn(List<RolUsuario> roles);

    long countByRolAndActivoTrue(RolUsuario rol);

    List<Usuario> findByGenero(Genero genero);

    List<Usuario> findByNivelEducativo(NivelEducativo nivelEducativo);

    List<Usuario> findByAutoidentificacionEtnica(String autoidentificacionEtnica);
}
