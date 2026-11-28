package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.ListaNegraCandidatoResponse;
import org.certificaciones.funproeibbackend.dto.ListaNegraRequest;
import org.certificaciones.funproeibbackend.dto.ListaNegraResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.ListaNegra;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
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
import java.util.Set;
import java.util.stream.Collectors;

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

        ListaNegra guardada = listaNegraRepository.save(entrada);
        bloquearPostulacionesEnCurso(request.getCiPostulante());
        return mapToResponse(guardada);
    }

    // Una postulación ya decidida (ACEPTADA/RECHAZADA/EVALUADA) no se toca:
    // el bloqueo aplica hacia adelante, no reescribe una decisión ya tomada.
    // Solo las que siguen en trámite (INCOMPLETA/PENDIENTE) se bloquean, lo
    // que además libera su cupo (countByProgramaIdAndEstadoNotIn en
    // PostulacionServiceImpl.crear ya excluye BLOQUEADA).
    private void bloquearPostulacionesEnCurso(String ci) {
        List<Postulacion> enCurso = postulacionRepository.findByUsuarioCiAndEstadoIn(
                ci, List.of(EstadoPostulacion.INCOMPLETA, EstadoPostulacion.PENDIENTE));
        enCurso.forEach(p -> p.setEstado(EstadoPostulacion.BLOQUEADA));
        postulacionRepository.saveAll(enCurso);
    }

    @Override
    public boolean estaEnListaNegra(String ci) {
        return listaNegraRepository.existsByCiPostulanteAndActivoTrue(ci);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListaNegraResponse> listarActivos() {
        List<ListaNegra> activos = listaNegraRepository.findByActivoTrue();
        if (activos.isEmpty()) {
            return List.of();
        }

        // Una sola consulta por todos los CI (en vez de una por fila) para
        // resolver el nombre del postulante.
        List<String> cis = activos.stream().map(ListaNegra::getCiPostulante).toList();
        Map<String, String> nombrePorCi = usuarioRepository.findByCiIn(cis).stream()
                .collect(Collectors.toMap(Usuario::getCi, Usuario::getNombreCompleto));

        return activos.stream()
                .map(ln -> mapToResponse(ln, nombrePorCi.get(ln.getCiPostulante())))
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
        // La lista negra activa es corta (son personas bloqueadas, no todos
        // los usuarios): traerla una sola vez y consultar en memoria evita
        // una consulta "exists" por cada postulación con abandono.
        Set<String> ciEnListaNegra = listaNegraRepository.findByActivoTrue().stream()
                .map(ListaNegra::getCiPostulante)
                .collect(Collectors.toSet());

        Map<Long, ListaNegraCandidatoResponse.ListaNegraCandidatoResponseBuilder> candidatos = new LinkedHashMap<>();
        Map<Long, List<String>> programasPorUsuario = new LinkedHashMap<>();

        for (Postulacion p : postulacionRepository.findConAbandono()) {
            Usuario u = p.getUsuario();
            if (ciEnListaNegra.contains(u.getCi())) {
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
        return mapToResponse(ln, nombrePostulante);
    }

    private ListaNegraResponse mapToResponse(ListaNegra ln, String nombrePostulante) {
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
