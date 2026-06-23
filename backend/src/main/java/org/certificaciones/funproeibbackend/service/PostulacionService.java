package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.PostulacionRequest;
import org.certificaciones.funproeibbackend.dto.PostulacionResponse;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;

import java.util.List;

public interface PostulacionService {
    PostulacionResponse crear(PostulacionRequest request);
    PostulacionResponse obtenerPorId(Long id);
    List<PostulacionResponse> listarPorPrograma(Long idPrograma);
    List<PostulacionResponse> listarPorUsuario(Long idUsuario);
    List<PostulacionResponse> listarPorEstado(EstadoPostulacion estado);
    PostulacionResponse cambiarEstado(Long id, EstadoPostulacion nuevoEstado);
}
