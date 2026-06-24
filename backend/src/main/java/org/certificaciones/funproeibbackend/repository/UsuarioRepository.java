package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreo(String correo);

    Optional<Usuario> findByCi(String ci);

    boolean existsByCorreo(String correo);

    boolean existsByCi(String ci);

    List<Usuario> findByRol(RolUsuario rol);

    List<Usuario> findByGenero(Genero genero);

    List<Usuario> findByNivelEducativo(NivelEducativo nivelEducativo);

    List<Usuario> findByPaisOrigen(String paisOrigen);

    List<Usuario> findByAutoidentificacionEtnica(String autoidentificacionEtnica);
}
