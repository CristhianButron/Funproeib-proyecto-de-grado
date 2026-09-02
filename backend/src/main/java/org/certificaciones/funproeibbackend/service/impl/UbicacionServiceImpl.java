package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.CiudadResponse;
import org.certificaciones.funproeibbackend.dto.PaisResponse;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Pais;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.PaisRepository;
import org.certificaciones.funproeibbackend.service.UbicacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UbicacionServiceImpl implements UbicacionService {

    private final PaisRepository paisRepository;
    private final CiudadRepository ciudadRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PaisResponse> listarPaises() {
        return paisRepository.findAllByOrderByNombreAsc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CiudadResponse> listarCiudadesPorPais(Long idPais) {
        return ciudadRepository.findByPaisIdOrderByNombreAsc(idPais).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private PaisResponse mapToResponse(Pais pais) {
        return PaisResponse.builder()
                .id(pais.getId())
                .nombre(pais.getNombre())
                .build();
    }

    private CiudadResponse mapToResponse(Ciudad ciudad) {
        return CiudadResponse.builder()
                .id(ciudad.getId())
                .nombre(ciudad.getNombre())
                .idPais(ciudad.getPais().getId())
                .nombrePais(ciudad.getPais().getNombre())
                .build();
    }
}
