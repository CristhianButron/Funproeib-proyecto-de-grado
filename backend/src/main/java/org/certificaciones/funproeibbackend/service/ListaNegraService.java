package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ListaNegraRequest;
import org.certificaciones.funproeibbackend.dto.ListaNegraResponse;

import java.util.List;

public interface ListaNegraService {
    ListaNegraResponse agregar(ListaNegraRequest request);
    boolean estaEnListaNegra(String ci);
    List<ListaNegraResponse> listarActivos();
    ListaNegraResponse desactivar(Long id);
}
