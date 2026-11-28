package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ListaNegraCandidatoResponse;
import org.certificaciones.funproeibbackend.dto.ListaNegraRequest;
import org.certificaciones.funproeibbackend.dto.ListaNegraResponse;

import java.util.List;

public interface ListaNegraService {
    ListaNegraResponse agregar(ListaNegraRequest request);
    boolean estaEnListaNegra(String ci);
    List<ListaNegraResponse> listarActivos();
    ListaNegraResponse desactivar(Long id);

    /**
     * Postulantes con alguna postulación marcada como ABANDONO que todavía
     * no están bloqueados: candidatos naturales a lista negra, pero no
     * entran automáticamente (el abandono puede tener una explicación
     * válida, así que lo decide un ADMIN caso por caso).
     */
    List<ListaNegraCandidatoResponse> listarCandidatosAbandono();
}
