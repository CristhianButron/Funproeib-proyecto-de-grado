package org.certificaciones.funproeibbackend.controller;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.DocumentoRequest;
import org.certificaciones.funproeibbackend.dto.DocumentoResponse;
import org.certificaciones.funproeibbackend.service.DocumentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// Los documentos cuelgan de una postulación, no directamente de un usuario,
// así que la autorización por dueño no puede comparar un id de la ruta
// contra authentication.name como en otros controladores: necesita resolver
// primero de quién es la postulación (ver RecursoAuthService/@recursoAuth).
// Antes cualquier usuario autenticado podía leer o escribir cualquier
// documento adivinando su id; quedaba señalado como limitación conocida en
// SecurityConfig.
@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoService documentoService;

    @PreAuthorize("hasAnyRole('ADMIN','EVALUADOR') or @recursoAuth.esDuenoDePostulacion(#request.idPostulacion, authentication.name)")
    @PostMapping
    public ResponseEntity<DocumentoResponse> registrar(@Valid @RequestBody DocumentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentoService.registrar(request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EVALUADOR') or @recursoAuth.esDuenoDePostulacion(#idPostulacion, authentication.name)")
    @PostMapping(value = "/subir", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentoResponse> subir(
            @RequestParam Long idPostulacion,
            @RequestParam Long idReqDocumento,
            @RequestParam("archivo") MultipartFile archivo) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentoService.subirArchivo(idPostulacion, idReqDocumento, archivo));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EVALUADOR') or @recursoAuth.esDuenoDeDocumento(#id, authentication.name)")
    @GetMapping("/{id}/archivo")
    public ResponseEntity<Resource> descargar(@PathVariable Long id) {
        ArchivoDescargable archivo = documentoService.descargar(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + archivo.getNombreArchivo() + "\"")
                .body(archivo.getRecurso());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EVALUADOR') or @recursoAuth.esDuenoDePostulacion(#idPostulacion, authentication.name)")
    @GetMapping("/postulacion/{idPostulacion}")
    public ResponseEntity<List<DocumentoResponse>> listarPorPostulacion(@PathVariable Long idPostulacion) {
        return ResponseEntity.ok(documentoService.listarPorPostulacion(idPostulacion));
    }

    @PatchMapping("/{id}/verificar")
    public ResponseEntity<DocumentoResponse> verificar(@PathVariable Long id) {
        return ResponseEntity.ok(documentoService.verificar(id));
    }

    @PatchMapping("/postulacion/{idPostulacion}/verificar-todos")
    public ResponseEntity<Void> verificarTodos(@PathVariable Long idPostulacion) {
        documentoService.verificarTodosDePostulacion(idPostulacion);
        return ResponseEntity.noContent().build();
    }

    // Solo ADMIN o el dueño, no EVALUADOR (igual que verificar): borrar un
    // documento ya verificado se rechaza del lado del servicio, salvo que lo
    // pida un ADMIN (corrigiendo un error del postulante desde la ficha).
    @PreAuthorize("hasRole('ADMIN') or @recursoAuth.esDuenoDeDocumento(#id, authentication.name)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, Authentication authentication) {
        boolean esAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        documentoService.eliminar(id, esAdmin);
        return ResponseEntity.noContent().build();
    }
}
