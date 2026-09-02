package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.CiudadResponse;
import org.certificaciones.funproeibbackend.dto.PaisResponse;

import java.util.List;

public interface UbicacionService {
    List<PaisResponse> listarPaises();
    List<CiudadResponse> listarCiudadesPorPais(Long idPais);
}
