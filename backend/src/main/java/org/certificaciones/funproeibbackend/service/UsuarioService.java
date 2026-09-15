package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.CambiarPasswordRequest;
import org.certificaciones.funproeibbackend.dto.LoginRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioRegistroRequest;
import org.certificaciones.funproeibbackend.dto.UsuarioResponse;

import java.util.List;

public interface UsuarioService {
    UsuarioResponse registrar(UsuarioRegistroRequest request);
    UsuarioResponse login(LoginRequest request);
    UsuarioResponse obtenerPorId(Long id);
    List<UsuarioResponse> listarTodos();
    void verificarCorreo(String token);
    void reenviarVerificacion(String correo);
    void cambiarPassword(CambiarPasswordRequest request);
}