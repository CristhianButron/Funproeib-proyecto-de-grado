package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.CambiarPasswordRequest;
import org.certificaciones.funproeibbackend.dto.LoginRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioRegistroRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.EmailService;
import org.certificaciones.funproeibbackend.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private static final String ALFABETO_PASSWORD_TEMPORAL = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final int LONGITUD_PASSWORD_TEMPORAL = 10;
    private static final int HORAS_VALIDEZ_TOKEN_VERIFICACION = 24;

    private final UsuarioRepository usuarioRepository;
    private final CiudadRepository ciudadRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public UsuarioResponse registrar(UsuarioRegistroRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("Ya existe un usuario registrado con ese correo");
        }
        if (usuarioRepository.existsByCi(request.getCi())) {
            throw new BusinessException("Ya existe un usuario registrado con ese CI");
        }
        if (request.getNivelEducativo() != NivelEducativo.SECUNDARIA
                && (request.getCarreras() == null || request.getCarreras().isEmpty())) {
            throw new BusinessException("Debe indicar al menos una carrera o profesión");
        }

        Ciudad ciudad = ciudadRepository.findById(request.getIdCiudad())
                .orElseThrow(() -> new ResourceNotFoundException("Ciudad no encontrada con id: " + request.getIdCiudad()));
        Ciudad ciudadNacimiento = ciudadRepository.findById(request.getIdCiudadNacimiento())
                .orElseThrow(() -> new ResourceNotFoundException("Ciudad de nacimiento no encontrada con id: " + request.getIdCiudadNacimiento()));

        String contrasenaTemporal = generarContrasenaTemporal();

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .apellidoPaterno(request.getApellidoPaterno())
                .apellidoMaterno(request.getApellidoMaterno())
                .correo(request.getCorreo())
                .contrasenaHash(passwordEncoder.encode(contrasenaTemporal))
                .ci(request.getCi())
                .ciExtension(request.getCiExtension())
                .rol(RolUsuario.POSTULANTE)
                .fechaRegistro(LocalDate.now())
                .activo(true)
                .emailVerificado(false)
                .tokenVerificacion(UUID.randomUUID().toString())
                .tokenVerificacionExpira(LocalDateTime.now().plusHours(HORAS_VALIDEZ_TOKEN_VERIFICACION))
                .debeCambiarPassword(true)
                .genero(request.getGenero())
                .fechaNacimiento(request.getFechaNacimiento())
                .autoidentificacionEtnica(request.getAutoidentificacionEtnica())
                .nivelEducativo(request.getNivelEducativo())
                .ciudad(ciudad)
                .telefono(request.getTelefono())
                .estadoCivil(request.getEstadoCivil())
                .ciudadNacimiento(ciudadNacimiento)
                .provinciaNacimiento(request.getProvinciaNacimiento())
                .direccionDomicilio(request.getDireccionDomicilio())
                .carreras(request.getCarreras() != null ? request.getCarreras() : List.of())
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
        emailService.enviarVerificacionCuenta(guardado.getCorreo(), guardado.getNombre(), guardado.getTokenVerificacion(), contrasenaTemporal);

        return mapToResponse(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new BusinessException("Correo o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getContrasena(), usuario.getContrasenaHash())) {
            throw new BusinessException("Correo o contraseña incorrectos");
        }

        if (!Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw new BusinessException("Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.");
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

    @Override
    @Transactional
    public void verificarCorreo(String token) {
        Usuario usuario = usuarioRepository.findByTokenVerificacion(token)
                .orElseThrow(() -> new BusinessException("El enlace de verificación no es válido"));

        if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            return;
        }
        if (usuario.getTokenVerificacionExpira() == null || usuario.getTokenVerificacionExpira().isBefore(LocalDateTime.now())) {
            throw new BusinessException("El enlace de verificación expiró. Solicita uno nuevo.");
        }

        usuario.setEmailVerificado(true);
        usuario.setTokenVerificacion(null);
        usuario.setTokenVerificacionExpira(null);
        usuarioRepository.save(usuario);
    }

    @Override
    @Transactional
    public void reenviarVerificacion(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new BusinessException("No existe una cuenta registrada con ese correo"));

        if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw new BusinessException("Esta cuenta ya fue verificada, puedes iniciar sesión");
        }

        String contrasenaTemporal = generarContrasenaTemporal();
        usuario.setContrasenaHash(passwordEncoder.encode(contrasenaTemporal));
        usuario.setTokenVerificacion(UUID.randomUUID().toString());
        usuario.setTokenVerificacionExpira(LocalDateTime.now().plusHours(HORAS_VALIDEZ_TOKEN_VERIFICACION));
        usuarioRepository.save(usuario);

        emailService.enviarVerificacionCuenta(usuario.getCorreo(), usuario.getNombre(), usuario.getTokenVerificacion(), contrasenaTemporal);
    }

    @Override
    @Transactional
    public void cambiarPassword(CambiarPasswordRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdUsuario())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + request.getIdUsuario()));

        if (!passwordEncoder.matches(request.getContrasenaActual(), usuario.getContrasenaHash())) {
            throw new BusinessException("La contraseña actual no es correcta");
        }

        usuario.setContrasenaHash(passwordEncoder.encode(request.getContrasenaNueva()));
        usuario.setDebeCambiarPassword(false);
        usuarioRepository.save(usuario);
    }

    private String generarContrasenaTemporal() {
        StringBuilder sb = new StringBuilder(LONGITUD_PASSWORD_TEMPORAL);
        for (int i = 0; i < LONGITUD_PASSWORD_TEMPORAL; i++) {
            sb.append(ALFABETO_PASSWORD_TEMPORAL.charAt(secureRandom.nextInt(ALFABETO_PASSWORD_TEMPORAL.length())));
        }
        return sb.toString();
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
                .ciExtension(usuario.getCiExtension())
                .rol(usuario.getRol())
                .fechaRegistro(usuario.getFechaRegistro())
                .activo(usuario.getActivo())
                .emailVerificado(usuario.getEmailVerificado())
                .debeCambiarPassword(usuario.getDebeCambiarPassword())
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
                .estadoCivil(usuario.getEstadoCivil())
                .idCiudadNacimiento(usuario.getCiudadNacimiento() != null ? usuario.getCiudadNacimiento().getId() : null)
                .ciudadNacimiento(usuario.getCiudadNacimiento() != null ? usuario.getCiudadNacimiento().getNombre() : null)
                .idPaisNacimiento(usuario.getCiudadNacimiento() != null && usuario.getCiudadNacimiento().getPais() != null ? usuario.getCiudadNacimiento().getPais().getId() : null)
                .paisNacimiento(usuario.getCiudadNacimiento() != null && usuario.getCiudadNacimiento().getPais() != null ? usuario.getCiudadNacimiento().getPais().getNombre() : null)
                .provinciaNacimiento(usuario.getProvinciaNacimiento())
                .direccionDomicilio(usuario.getDireccionDomicilio())
                .carreras(List.copyOf(usuario.getCarreras()))
                .build();
    }
}
