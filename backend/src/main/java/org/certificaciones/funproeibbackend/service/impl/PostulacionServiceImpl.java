package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.PostulacionRequest;
import org.certificaciones.funproeibbackend.dto.PostulacionResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.repository.ListaNegraRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.PostulacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostulacionServiceImpl implements PostulacionService {

    private final PostulacionRepository postulacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProgramaRepository programaRepository;
    private final ListaNegraRepository listaNegraRepository;

    @Override
    @Transactional
    public PostulacionResponse crear(PostulacionRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdUsuario())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + request.getIdUsuario()));

        Programa programa = programaRepository.findById(request.getIdPrograma())
                .orElseThrow(() -> new ResourceNotFoundException("Programa no encontrado con id: " + request.getIdPrograma()));

        if (listaNegraRepository.existsByCiPostulanteAndActivoTrue(usuario.getCi())) {
            throw new BusinessException("El usuario está en lista negra y no puede postularse");
        }

        if (!programa.getEstado().equals(EstadoPrograma.ABIERTO)) {
            throw new BusinessException("El programa no está abierto para postulaciones");
        }

        if (programa.getCuposDisponibles() <= 0) {
            throw new BusinessException("El programa no tiene cupos disponibles");
        }

        if (postulacionRepository.existsByUsuarioIdAndProgramaId(usuario.getId(), programa.getId())) {
            throw new BusinessException("El usuario ya tiene una postulación activa en este programa");
        }

        Postulacion postulacion = Postulacion.builder()
                .usuario(usuario)
                .programa(programa)
                .fechaPostulacion(LocalDate.now())
                .estado(EstadoPostulacion.INCOMPLETA)
                .build();

        return mapToResponse(postulacionRepository.save(postulacion));
    }

    @Override
    public PostulacionResponse obtenerPorId(Long id) {
        return mapToResponse(buscarPostulacion(id));
    }

    @Override
    public List<PostulacionResponse> listarPorPrograma(Long idPrograma) {
        return postulacionRepository.findByProgramaId(idPrograma).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<PostulacionResponse> listarPorUsuario(Long idUsuario) {
        return postulacionRepository.findByUsuarioId(idUsuario).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<PostulacionResponse> listarPorEstado(EstadoPostulacion estado) {
        return postulacionRepository.findByEstado(estado).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public PostulacionResponse cambiarEstado(Long id, EstadoPostulacion nuevoEstado) {
        Postulacion postulacion = buscarPostulacion(id);
        postulacion.setEstado(nuevoEstado);
        return mapToResponse(postulacionRepository.save(postulacion));
    }

    private Postulacion buscarPostulacion(Long id) {
        return postulacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Postulación no encontrada con id: " + id));
    }

    private PostulacionResponse mapToResponse(Postulacion p) {
        return PostulacionResponse.builder()
                .id(p.getId())
                .idUsuario(p.getUsuario().getId())
                .nombrePostulante(p.getUsuario().getNombreCompleto())
                .idPrograma(p.getPrograma().getId())
                .nombrePrograma(p.getPrograma().getNombre())
                .fechaPostulacion(p.getFechaPostulacion())
                .estado(p.getEstado())
                .build();
    }
}
