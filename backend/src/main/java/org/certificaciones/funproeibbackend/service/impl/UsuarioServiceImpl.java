package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.CambiarPasswordRequest;
import org.certificaciones.funproeibbackend.dto.LoginRequest;
import org.certificaciones.funproeibbackend.dto.RestablecerPasswordRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioActualizarRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioRegistroRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.DocumentoRepository;
import org.certificaciones.funproeibbackend.repository.EvaluacionRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.RespuestaPostulacionRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.security.JwtService;
import org.certificaciones.funproeibbackend.service.EmailService;
import org.certificaciones.funproeibbackend.service.UsuarioService;
import org.certificaciones.funproeibbackend.util.CorreoDesechableValidator;
import org.certificaciones.funproeibbackend.util.TipoArchivoValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private static final String ALFABETO_PASSWORD_TEMPORAL = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final int LONGITUD_PASSWORD_TEMPORAL = 10;
    private static final int HORAS_VALIDEZ_TOKEN_VERIFICACION = 24;
    private static final int HORAS_VALIDEZ_TOKEN_RECUPERACION = 1;
    private static final Map<String, String> EXTENSIONES_IMAGEN = Map.of(
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg"
    );
    private static final long TAMANO_MAXIMO_CARNET_BYTES = 10L * 1024 * 1024;

    private final UsuarioRepository usuarioRepository;
    private final CiudadRepository ciudadRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final PostulacionRepository postulacionRepository;
    private final DocumentoRepository documentoRepository;
    private final RespuestaPostulacionRepository respuestaPostulacionRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    @Override
    @Transactional
    public UsuarioResponse registrar(UsuarioRegistroRequest request, MultipartFile carnetAnverso, MultipartFile carnetReverso) {
        validarImagenCarnet(carnetAnverso, "anverso");
        validarImagenCarnet(carnetReverso, "reverso");

        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("Ya existe un usuario registrado con ese correo");
        }
        if (CorreoDesechableValidator.esDesechable(request.getCorreo())) {
            throw new BusinessException("No se aceptan correos de proveedores de buzón temporal. "
                    + "Usa un correo personal o institucional válido.");
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

        guardado.setRutaCarnetAnverso(guardarImagenCarnet(guardado.getId(), "anverso", carnetAnverso));
        guardado.setRutaCarnetReverso(guardarImagenCarnet(guardado.getId(), "reverso", carnetReverso));
        guardado = usuarioRepository.save(guardado);

        emailService.enviarVerificacionCuenta(guardado.getCorreo(), guardado.getNombre(), guardado.getTokenVerificacion(), contrasenaTemporal);

        return mapToResponse(guardado);
    }

    private void validarImagenCarnet(MultipartFile archivo, String lado) {
        if (archivo == null || archivo.isEmpty()) {
            throw new BusinessException("Debes subir la foto del " + lado + " de tu carnet de identidad");
        }
        if (archivo.getSize() > TAMANO_MAXIMO_CARNET_BYTES) {
            throw new BusinessException("La foto del " + lado + " del carnet supera el tamaño máximo permitido (10MB)");
        }
        String nombreOriginal = StringUtils.cleanPath(
                archivo.getOriginalFilename() == null ? "" : archivo.getOriginalFilename());
        String extension = obtenerExtension(nombreOriginal);
        if (!EXTENSIONES_IMAGEN.containsKey(extension)) {
            throw new BusinessException("La foto del " + lado + " del carnet debe ser una imagen JPG o PNG");
        }

        // No alcanza con confiar en la extensión del nombre de archivo:
        // cualquiera puede renombrar un video pesado a "foto.jpg" para
        // saltarse el filtro de arriba (ver TipoArchivoValidator).
        try {
            if (!TipoArchivoValidator.contenidoCoincideConExtension(archivo.getBytes(), extension)) {
                throw new BusinessException("La foto del " + lado + " del carnet no es una imagen JPG o PNG válida "
                        + "(¿se renombró un archivo de otro tipo?)");
            }
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer la foto del " + lado + " del carnet", e);
        }
    }

    private String guardarImagenCarnet(Long idUsuario, String lado, MultipartFile archivo) {
        try {
            Path carpetaUsuario = Paths.get(uploadsDir, "usuario-" + idUsuario).toAbsolutePath().normalize();
            Files.createDirectories(carpetaUsuario);

            String extension = obtenerExtension(StringUtils.cleanPath(archivo.getOriginalFilename()));
            String nombreGuardado = "carnet-" + lado + "." + extension;
            Path destino = carpetaUsuario.resolve(nombreGuardado).normalize();
            if (!destino.startsWith(carpetaUsuario)) {
                throw new BusinessException("Nombre de archivo inválido");
            }
            archivo.transferTo(destino);

            return "usuario-" + idUsuario + "/" + nombreGuardado;
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar la foto del carnet", e);
        }
    }

    private String obtenerExtension(String nombreArchivo) {
        int punto = nombreArchivo.lastIndexOf('.');
        return punto >= 0 && punto < nombreArchivo.length() - 1
                ? nombreArchivo.substring(punto + 1).toLowerCase()
                : "";
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

        if (!Boolean.TRUE.equals(usuario.getIdentidadVerificada())) {
            throw new BusinessException("Tu cuenta está en revisión: un administrador debe verificar la foto de tu carnet de identidad antes de que puedas iniciar sesión.");
        }

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new BusinessException("La cuenta está desactivada");
        }

        UsuarioResponse response = mapToResponse(usuario);
        response.setToken(jwtService.generarToken(usuario.getId(), usuario.getRol()));
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorId(Long id) {
        return mapToResponse(buscarUsuario(id));
    }

    @Override
    @Transactional
    public UsuarioResponse actualizarPerfil(Long id, UsuarioActualizarRequest request) {
        Usuario usuario = buscarUsuario(id);

        if (!usuario.getCi().equals(request.getCi()) && usuarioRepository.existsByCi(request.getCi())) {
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

        usuario.setNombre(request.getNombre());
        usuario.setApellidoPaterno(request.getApellidoPaterno());
        usuario.setApellidoMaterno(request.getApellidoMaterno());
        usuario.setCi(request.getCi());
        usuario.setCiExtension(request.getCiExtension());
        usuario.setGenero(request.getGenero());
        usuario.setFechaNacimiento(request.getFechaNacimiento());
        usuario.setAutoidentificacionEtnica(request.getAutoidentificacionEtnica());
        usuario.setNivelEducativo(request.getNivelEducativo());
        usuario.setCiudad(ciudad);
        usuario.setTelefono(request.getTelefono());
        usuario.setEstadoCivil(request.getEstadoCivil());
        usuario.setCiudadNacimiento(ciudadNacimiento);
        usuario.setProvinciaNacimiento(request.getProvinciaNacimiento());
        usuario.setDireccionDomicilio(request.getDireccionDomicilio());
        usuario.setCarreras(request.getCarreras() != null ? request.getCarreras() : List.of());

        usuarioRepository.save(usuario);
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

    @Override
    @Transactional
    public void solicitarRecuperacionPassword(String correo) {
        // A propósito no revela si el correo existe o no (ni con una excepción
        // ni con el tiempo de respuesta): si alguien no encontrara nada acá,
        // igual sabría que esa cuenta no existe, lo que es información que no
        // le corresponde. Por eso el controlador siempre responde 204 pase lo
        // que pase adentro.
        usuarioRepository.findByCorreo(correo).ifPresent(usuario -> {
            usuario.setTokenRecuperacion(UUID.randomUUID().toString());
            usuario.setTokenRecuperacionExpira(LocalDateTime.now().plusHours(HORAS_VALIDEZ_TOKEN_RECUPERACION));
            usuarioRepository.save(usuario);
            emailService.enviarRecuperacionPassword(usuario.getCorreo(), usuario.getNombre(), usuario.getTokenRecuperacion());
        });
    }

    @Override
    @Transactional
    public void restablecerPassword(RestablecerPasswordRequest request) {
        Usuario usuario = usuarioRepository.findByTokenRecuperacion(request.getToken())
                .orElseThrow(() -> new BusinessException("El enlace para restablecer la contraseña no es válido"));

        if (usuario.getTokenRecuperacionExpira() == null || usuario.getTokenRecuperacionExpira().isBefore(LocalDateTime.now())) {
            throw new BusinessException("El enlace para restablecer la contraseña expiró. Solicita uno nuevo.");
        }

        usuario.setContrasenaHash(passwordEncoder.encode(request.getContrasenaNueva()));
        usuario.setDebeCambiarPassword(false);
        usuario.setTokenRecuperacion(null);
        usuario.setTokenRecuperacionExpira(null);
        usuarioRepository.save(usuario);
    }

    @Override
    @Transactional
    public UsuarioResponse cambiarRol(Long id, RolUsuario nuevoRol) {
        Usuario usuario = buscarUsuario(id);
        if (usuario.getRol() != nuevoRol) {
            validarNoDejaSistemaSinAdmin(usuario);
            usuario.setRol(nuevoRol);
            usuarioRepository.save(usuario);
        }
        return mapToResponse(usuario);
    }

    @Override
    @Transactional
    public UsuarioResponse cambiarActivo(Long id, boolean activo) {
        Usuario usuario = buscarUsuario(id);
        if (!activo && Boolean.TRUE.equals(usuario.getActivo())) {
            validarNoDejaSistemaSinAdmin(usuario);
        }
        usuario.setActivo(activo);
        usuarioRepository.save(usuario);
        return mapToResponse(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public ArchivoDescargable obtenerCarnet(Long id, boolean anverso) {
        Usuario usuario = buscarUsuario(id);
        String ruta = anverso ? usuario.getRutaCarnetAnverso() : usuario.getRutaCarnetReverso();
        if (ruta == null) {
            throw new ResourceNotFoundException("Este usuario no tiene foto de carnet (" + (anverso ? "anverso" : "reverso") + ") cargada");
        }

        try {
            Path raiz = Paths.get(uploadsDir).toAbsolutePath().normalize();
            Path destino = raiz.resolve(ruta).normalize();
            if (!destino.startsWith(raiz) || !Files.exists(destino)) {
                throw new ResourceNotFoundException("La foto del carnet ya no está disponible en el servidor");
            }

            String contentType = Files.probeContentType(destino);
            Resource recurso = new UrlResource(destino.toUri());

            return ArchivoDescargable.builder()
                    .recurso(recurso)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .nombreArchivo(destino.getFileName().toString())
                    .build();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer la foto del carnet", e);
        }
    }

    // Filtra en memoria en vez de con una consulta derivada
    // ("findByIdentidadVerificadaFalse"): en SQL, "= false" o "<> true" no
    // devuelve las filas con NULL (p. ej. cuentas sembradas antes de este
    // campo existir), así que se quedarían sin aparecer en vez de aparecer
    // como pendientes.
    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listarPendientesIdentidad() {
        return usuarioRepository.findAll().stream()
                .filter(u -> !Boolean.TRUE.equals(u.getIdentidadVerificada()))
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public UsuarioResponse verificarIdentidad(Long id) {
        Usuario usuario = buscarUsuario(id);
        if (usuario.getRutaCarnetAnverso() == null || usuario.getRutaCarnetReverso() == null) {
            throw new BusinessException("No se puede verificar la identidad: faltan las fotos del carnet");
        }
        usuario.setIdentidadVerificada(true);
        return mapToResponse(usuarioRepository.save(usuario));
    }

    // Rechazar la identidad no deja un estado "rechazada" guardado: se
    // considera un intento de falsificación de identidad, así que se da de
    // baja la cuenta completa (y todas sus postulaciones, documentos,
    // respuestas y evaluaciones) y se le avisa por correo. Es una acción
    // irreversible a propósito -no hay vuelta atrás una vez confirmada desde
    // el panel de administración.
    @Override
    @Transactional
    public void rechazarIdentidad(Long id) {
        Usuario usuario = buscarUsuario(id);
        String correo = usuario.getCorreo();
        String nombre = usuario.getNombre();

        List<Postulacion> postulaciones = postulacionRepository.findByUsuarioId(id);
        for (Postulacion p : postulaciones) {
            evaluacionRepository.findByPostulacionId(p.getId()).ifPresent(evaluacionRepository::delete);
            respuestaPostulacionRepository.deleteAll(respuestaPostulacionRepository.findByPostulacionId(p.getId()));
            documentoRepository.deleteAll(documentoRepository.findByPostulacionId(p.getId()));
        }
        postulacionRepository.deleteAll(postulaciones);
        usuarioRepository.delete(usuario);

        emailService.enviarRechazoIdentidad(correo, nombre);
    }

    // Distinto de rechazarIdentidad: esto es una baja administrativa normal
    // (sin correo de aviso por falsificación), para cuentas que ya no
    // corresponden que existan. Activo/inactivo sigue siendo la forma de
    // suspender sin perder el historial; esto lo borra todo sin vuelta atrás.
    @Override
    @Transactional
    public void eliminar(Long id) {
        Usuario usuario = buscarUsuario(id);
        if (usuario.getRol() == RolUsuario.ADMIN) {
            validarNoDejaSistemaSinAdmin(usuario);
        }
        if (evaluacionRepository.existsByEvaluadorId(id)) {
            throw new BusinessException("No se puede eliminar: este usuario ya registró evaluaciones. Desactívalo en vez de eliminarlo.");
        }

        List<Postulacion> postulaciones = postulacionRepository.findByUsuarioId(id);
        for (Postulacion p : postulaciones) {
            evaluacionRepository.findByPostulacionId(p.getId()).ifPresent(evaluacionRepository::delete);
            respuestaPostulacionRepository.deleteAll(respuestaPostulacionRepository.findByPostulacionId(p.getId()));
            documentoRepository.deleteAll(documentoRepository.findByPostulacionId(p.getId()));
        }
        postulacionRepository.deleteAll(postulaciones);
        usuarioRepository.delete(usuario);
    }

    /**
     * Evita que se degrade o desactive al último administrador activo del
     * sistema, lo que dejaría el panel de administración inaccesible para
     * todos.
     */
    private void validarNoDejaSistemaSinAdmin(Usuario usuario) {
        if (usuario.getRol() == RolUsuario.ADMIN && Boolean.TRUE.equals(usuario.getActivo())
                && usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN) <= 1) {
            throw new BusinessException("No se puede dejar al sistema sin ningún administrador activo");
        }
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));
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
                .identidadVerificada(usuario.getIdentidadVerificada())
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
