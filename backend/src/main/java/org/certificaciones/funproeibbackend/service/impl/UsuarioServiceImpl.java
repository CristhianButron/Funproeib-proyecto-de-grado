package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.LoginRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioRegistroRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final CiudadRepository ciudadRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UsuarioResponse registrar(UsuarioRegistroRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("Ya existe un usuario registrado con ese correo");
        }
        if (usuarioRepository.existsByCi(request.getCi())) {
            throw new BusinessException("Ya existe un usuario registrado con ese CI");
        }

        Ciudad ciudad = ciudadRepository.findById(request.getIdCiudad())
                .orElseThrow(() -> new ResourceNotFoundException("Ciudad no encontrada con id: " + request.getIdCiudad()));

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .apellidoPaterno(request.getApellidoPaterno())
                .apellidoMaterno(request.getApellidoMaterno())
                .correo(request.getCorreo())
                .contrasenaHash(passwordEncoder.encode(request.getContrasena()))
                .ci(request.getCi())
                .rol(RolUsuario.POSTULANTE)
                .fechaRegistro(LocalDate.now())
                .activo(true)
                .genero(request.getGenero())
                .fechaNacimiento(request.getFechaNacimiento())
                .autoidentificacionEtnica(request.getAutoidentificacionEtnica())
                .nivelEducativo(request.getNivelEducativo())
                .ciudad(ciudad)
                .telefono(request.getTelefono())
                .build();

        return mapToResponse(usuarioRepository.save(usuario));
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new BusinessException("Correo o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getContrasena(), usuario.getContrasenaHash())) {
            throw new BusinessException("Correo o contraseña incorrectos");
        }

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new BusinessException("La cuenta está desactivada");
        }

        return mapToResponse(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));
        return mapToResponse(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    private UsuarioResponse mapToResponse(Usuario usuario) {
        Integer edad = null;
        if (usuario.getFechaNacimiento() != null) {
            edad = Period.between(usuario.getFechaNacimiento(), LocalDate.now()).getYears();
        }

        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellidoPaterno(usuario.getApellidoPaterno())
                .apellidoMaterno(usuario.getApellidoMaterno())
                .nombreCompleto(usuario.getNombreCompleto())
                .correo(usuario.getCorreo())
                .ci(usuario.getCi())
                .rol(usuario.getRol())
                .fechaRegistro(usuario.getFechaRegistro())
                .activo(usuario.getActivo())
                .genero(usuario.getGenero())
                .fechaNacimiento(usuario.getFechaNacimiento())
                .edad(edad)
                .autoidentificacionEtnica(usuario.getAutoidentificacionEtnica())
                .nivelEducativo(usuario.getNivelEducativo())
                .idCiudad(usuario.getCiudad() != null ? usuario.getCiudad().getId() : null)
                .ciudad(usuario.getCiudad() != null ? usuario.getCiudad().getNombre() : null)
                .idPais(usuario.getCiudad() != null && usuario.getCiudad().getPais() != null ? usuario.getCiudad().getPais().getId() : null)
                .pais(usuario.getCiudad() != null && usuario.getCiudad().getPais() != null ? usuario.getCiudad().getPais().getNombre() : null)
                .telefono(usuario.getTelefono())
                .build();
    }
}
