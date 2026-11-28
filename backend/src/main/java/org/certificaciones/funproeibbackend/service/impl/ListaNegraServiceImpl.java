package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.ListaNegraCandidatoResponse;
import org.certificaciones.funproeibbackend.dto.ListaNegraRequest;
import org.certificaciones.funproeibbackend.dto.ListaNegraResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.ListaNegra;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.repository.ListaNegraRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.ListaNegraService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ListaNegraServiceImpl implements ListaNegraService {

    private final ListaNegraRepository listaNegraRepository;
    private final UsuarioRepository usuarioRepository;
    private final PostulacionRepository postulacionRepository;

    @Override
    @Transactional
    public ListaNegraResponse agregar(ListaNegraRequest request) {
        if (listaNegraRepository.existsByCiPostulanteAndActivoTrue(request.getCiPostulante())) {
            throw new BusinessException("El CI " + request.getCiPostulante() + " ya se encuentra activo en la lista negra");
        }

        Usuario registradoPor = usuarioRepository.findById(request.getIdRegistradoPor())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario registrador no encontrado con id: " + request.getIdRegistradoPor()));

        ListaNegra entrada = ListaNegra.builder()
                .ciPostulante(request.getCiPostulante())
                .motivo(request.getMotivo())
                .observaciones(request.getObservaciones())
                .fechaRegistro(LocalDate.now())
                .registradoPor(registradoPor)
                .activo(true)
                .build();

        return mapToResponse(listaNegraRepository.save(entrada));
    }

    @Override
    public boolean estaEnListaNegra(String ci) {
        return listaNegraRepository.existsByCiPostulanteAndActivoTrue(ci);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListaNegraResponse> listarActivos() {
        return listaNegraRepository.findByActivoTrue().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public ListaNegraResponse desactivar(Long id) {
        ListaNegra entrada = listaNegraRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrada de lista negra no encontrada con id: " + id));

        if (!entrada.getActivo()) {
            throw new BusinessException("La entrada ya está desactivada");
        }

        entrada.setActivo(false);
        return mapToResponse(listaNegraRepository.save(entrada));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListaNegraCandidatoResponse> listarCandidatosAbandono() {
        Map<Long, ListaNegraCandidatoResponse.ListaNegraCandidatoResponseBuilder> candidatos = new LinkedHashMap<>();
        Map<Long, List<String>> programasPorUsuario = new LinkedHashMap<>();

        for (Postulacion p : postulacionRepository.findConAbandono()) {
            Usuario u = p.getUsuario();
            if (listaNegraRepository.existsByCiPostulanteAndActivoTrue(u.getCi())) {
                continue;
            }
            candidatos.computeIfAbsent(u.getId(), id -> ListaNegraCandidatoResponse.builder()
                    .idUsuario(u.getId()).nombreCompleto(u.getNombreCompleto()).ci(u.getCi()));
            programasPorUsuario.computeIfAbsent(u.getId(), id -> new ArrayList<>())
                    .add(p.getPrograma().getNombre());
        }

        return candidatos.entrySet().stream()
                .map(e -> e.getValue().programas(programasPorUsuario.get(e.getKey())).build())
                .toList();
    }

    private ListaNegraResponse mapToResponse(ListaNegra ln) {
        String nombrePostulante = usuarioRepository.findByCi(ln.getCiPostulante())
                .map(Usuario::getNombreCompleto)
                .orElse(null);

        return ListaNegraResponse.builder()
                .id(ln.getId())
                .ciPostulante(ln.getCiPostulante())
                .nombrePostulante(nombrePostulante)
                .motivo(ln.getMotivo())
                .observaciones(ln.getObservaciones())
                .fechaRegistro(ln.getFechaRegistro())
                .registradoPorNombre(ln.getRegistradoPor().getNombreCompleto())
                .activo(ln.getActivo())
                .build();
    }
}
