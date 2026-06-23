package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ProgramaRequest;
import org.certificaciones.funproeibbackend.dto.ProgramaResponse;

import java.util.List;

public interface ProgramaService {
    ProgramaResponse crear(ProgramaRequest request);
    ProgramaResponse obtenerPorId(Long id);
    List<ProgramaResponse> listarTodos();
    ProgramaResponse actualizar(Long id, ProgramaRequest request);
    ProgramaResponse cambiarEstado(Long id, String nuevoEstado);
}