package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.ListaNegraRequest;
import org.certificaciones.funproeibbackend.dto.ListaNegraResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.ListaNegra;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.repository.ListaNegraRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.ListaNegraService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ListaNegraServiceImpl implements ListaNegraService {

    private final ListaNegraRepository listaNegraRepository;
    private final UsuarioRepository usuarioRepository;

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

    private ListaNegraResponse mapToResponse(ListaNegra ln) {
        return ListaNegraResponse.builder()
                .id(ln.getId())
                .ciPostulante(ln.getCiPostulante())
                .motivo(ln.getMotivo())
                .fechaRegistro(ln.getFechaRegistro())
                .registradoPorNombre(ln.getRegistradoPor().getNombreCompleto())
                .activo(ln.getActivo())
                .build();
    }
}
