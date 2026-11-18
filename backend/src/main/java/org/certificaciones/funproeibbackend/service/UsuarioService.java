package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.CambiarPasswordRequest;
import org.certificaciones.funproeibbackend.dto.LoginRequest;
import org.certificaciones.funproeibbackend.dto.RestablecerPasswordRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioActualizarRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioRegistroRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioResponse;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UsuarioService {
    UsuarioResponse registrar(UsuarioRegistroRequest request, MultipartFile carnetAnverso, MultipartFile carnetReverso);
    UsuarioResponse login(LoginRequest request);
    UsuarioResponse obtenerPorId(Long id);
    UsuarioResponse actualizarPerfil(Long id, UsuarioActualizarRequest request);
    List<UsuarioResponse> listarTodos();
    void verificarCorreo(String token);
    void reenviarVerificacion(String correo);
    void cambiarPassword(CambiarPasswordRequest request);
    void solicitarRecuperacionPassword(String correo);
    void restablecerPassword(RestablecerPasswordRequest request);
    UsuarioResponse cambiarRol(Long id, RolUsuario nuevoRol);
    UsuarioResponse cambiarActivo(Long id, boolean activo);
    ArchivoDescargable obtenerCarnet(Long id, boolean anverso);
    List<UsuarioResponse> listarPendientesIdentidad();
    UsuarioResponse verificarIdentidad(Long id);
    void rechazarIdentidad(Long id);
    void eliminar(Long id);
}