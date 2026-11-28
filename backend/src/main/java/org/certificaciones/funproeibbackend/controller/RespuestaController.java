package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.RespuestaRequest;
import org.certificaciones.funproeibbackend.dto.RespuestaResponse;
import org.certificaciones.funproeibbackend.service.RespuestaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Las respuestas cuelgan de una postulación, igual que los documentos (ver
// DocumentoController): la autorización por dueño necesita resolver primero
// de quién es la postulación (ver RecursoAuthService/@recursoAuth), no
// comparar un id de ruta contra authentication.name.
@RestController
@RequestMapping("/api/respuestas")
@RequiredArgsConstructor
public class RespuestaController {

    private final RespuestaService respuestaService;

    @PreAuthorize("hasRole('ADMIN') or @recursoAuth.esDuenoDePostulacion(#request.idPostulacion, authentication.name)")
    @PostMapping
    public ResponseEntity<RespuestaResponse> guardar(@Valid @RequestBody RespuestaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(respuestaService.guardar(request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EVALUADOR') or @recursoAuth.esDuenoDePostulacion(#idPostulacion, authentication.name)")
    @GetMapping("/postulacion/{idPostulacion}")
    public ResponseEntity<List<RespuestaResponse>> listarPorPostulacion(@PathVariable Long idPostulacion) {
        return ResponseEntity.ok(respuestaService.listarPorPostulacion(idPostulacion));
    }

    @PreAuthorize("hasRole('ADMIN') or @recursoAuth.esDuenoDeRespuesta(#id, authentication.name)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        respuestaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
