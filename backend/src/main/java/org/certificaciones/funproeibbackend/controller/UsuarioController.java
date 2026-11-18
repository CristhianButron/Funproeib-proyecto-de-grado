package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.CambiarPasswordRequest;
import org.certificaciones.funproeibbackend.dto.LoginRequest;
import org.certificaciones.funproeibbackend.dto.OlvidePasswordRequest;
import org.certificaciones.funproeibbackend.dto.ReenviarVerificacionRequest;
import org.certificaciones.funproeibbackend.dto.RestablecerPasswordRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioActualizarRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioRegistroRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioResponse;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping(value = "/registro", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UsuarioResponse> registrar(
            @Valid @RequestPart("datos") UsuarioRegistroRequest request,
            @RequestPart("carnetAnverso") MultipartFile carnetAnverso,
            @RequestPart("carnetReverso") MultipartFile carnetReverso) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.registrar(request, carnetAnverso, carnetReverso));
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(usuarioService.login(request));
    }

    // Cualquiera puede ver/editar su propio perfil; un admin puede ver/editar
    // el de cualquiera (por ejemplo, la ficha del postulante en el panel).
    @PreAuthorize("hasRole('ADMIN') or #id.toString() == authentication.name")
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @PreAuthorize("hasRole('ADMIN') or #id.toString() == authentication.name")
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponse> actualizarPerfil(@PathVariable Long id, @Valid @RequestBody UsuarioActualizarRequest request) {
        return ResponseEntity.ok(usuarioService.actualizarPerfil(id, request));
    }

    @GetMapping
    public ResponseEntity<List<UsuarioResponse>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/verificar-correo")
    public ResponseEntity<Void> verificarCorreo(@RequestParam String token) {
        usuarioService.verificarCorreo(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reenviar-verificacion")
    public ResponseEntity<Void> reenviarVerificacion(@Valid @RequestBody ReenviarVerificacionRequest request) {
        usuarioService.reenviarVerificacion(request.getCorreo());
        return ResponseEntity.noContent().build();
    }

    // Siempre responde 204, exista o no esa cuenta: revelarlo permitiría
    // averiguar qué correos están registrados probando uno por uno.
    @PostMapping("/olvide-password")
    public ResponseEntity<Void> olvidePassword(@Valid @RequestBody OlvidePasswordRequest request) {
        usuarioService.solicitarRecuperacionPassword(request.getCorreo());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/restablecer-password")
    public ResponseEntity<Void> restablecerPassword(@Valid @RequestBody RestablecerPasswordRequest request) {
        usuarioService.restablecerPassword(request);
        return ResponseEntity.noContent().build();
    }

    // Solo uno mismo: ni siquiera el admin puede usar esto para cambiarle la
    // contraseña a otro (exige la actual, que el admin no conoce).
    @PreAuthorize("#request.idUsuario.toString() == authentication.name")
    @PostMapping("/cambiar-password")
    public ResponseEntity<Void> cambiarPassword(@Valid @RequestBody CambiarPasswordRequest request) {
        usuarioService.cambiarPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/rol")
    public ResponseEntity<UsuarioResponse> cambiarRol(@PathVariable Long id, @RequestParam RolUsuario rol) {
        return ResponseEntity.ok(usuarioService.cambiarRol(id, rol));
    }

    @PatchMapping("/{id}/activo")
    public ResponseEntity<UsuarioResponse> cambiarActivo(@PathVariable Long id, @RequestParam boolean activo) {
        return ResponseEntity.ok(usuarioService.cambiarActivo(id, activo));
    }

    @GetMapping("/{id}/carnet/anverso")
    public ResponseEntity<Resource> carnetAnverso(@PathVariable Long id) {
        return servirCarnet(usuarioService.obtenerCarnet(id, true));
    }

    @GetMapping("/{id}/carnet/reverso")
    public ResponseEntity<Resource> carnetReverso(@PathVariable Long id) {
        return servirCarnet(usuarioService.obtenerCarnet(id, false));
    }

    private ResponseEntity<Resource> servirCarnet(ArchivoDescargable archivo) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + archivo.getNombreArchivo() + "\"")
                .body(archivo.getRecurso());
    }

    @PatchMapping("/{id}/identidad/verificar")
    public ResponseEntity<UsuarioResponse> verificarIdentidad(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.verificarIdentidad(id));
    }

    // Elimina la cuenta completa del postulante (ver UsuarioServiceImpl): no
    // hay nada que devolver, ya no existe.
    @PatchMapping("/{id}/identidad/rechazar")
    public ResponseEntity<Void> rechazarIdentidad(@PathVariable Long id) {
        usuarioService.rechazarIdentidad(id);
        return ResponseEntity.noContent().build();
    }
}
