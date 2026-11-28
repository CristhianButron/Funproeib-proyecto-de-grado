package org.certificaciones.funproeibbackend.security;

import org.certificaciones.funproeibbackend.repository.DocumentoRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.RespuestaPostulacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Verifica que quien pide ver o crear un recurso anidado a una postulación
 * (documentos, respuestas) sea el dueño de esa postulación. Se usa desde
 * @PreAuthorize en DocumentoController y RespuestaController, donde el id de
 * la ruta es el del documento o de la postulación -no el del usuario-, así
 * que no alcanza con comparar contra authentication.name como en
 * PostulacionController/UsuarioController.
 *
 * Antes esto era una limitación conocida y documentada en SecurityConfig:
 * cualquier usuario autenticado podía leer o escribir estos recursos
 * adivinando el id, sin que importara de quién fueran.
 *
 * Si el recurso no existe, deniega en vez de lanzar: no le corresponde a la
 * autorización decidir si devolver 404 o no, eso lo resuelve el servicio
 * después para quien sí tiene permiso.
 */
@Component("recursoAuth")
@RequiredArgsConstructor
public class RecursoAuthService {

    private final PostulacionRepository postulacionRepository;
    private final DocumentoRepository documentoRepository;
    private final RespuestaPostulacionRepository respuestaRepository;

    // @Transactional porque usuario/postulacion son relaciones LAZY: sin una
    // sesión abierta durante el .map(), acceder a getUsuario() después de
    // que el findById ya cerró su propia transacción implícita lanzaría
    // LazyInitializationException (esto se ejecuta antes del método del
    // controlador, fuera del @Transactional del servicio de destino).
    @Transactional(readOnly = true)
    public boolean esDuenoDePostulacion(Long idPostulacion, String idUsuarioAutenticado) {
        if (idPostulacion == null || idUsuarioAutenticado == null) {
            return false;
        }
        return postulacionRepository.findById(idPostulacion)
                .map(p -> idUsuarioAutenticado.equals(p.getUsuario().getId().toString()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean esDuenoDeDocumento(Long idDocumento, String idUsuarioAutenticado) {
        if (idDocumento == null || idUsuarioAutenticado == null) {
            return false;
        }
        return documentoRepository.findById(idDocumento)
                .map(d -> idUsuarioAutenticado.equals(d.getPostulacion().getUsuario().getId().toString()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean esDuenoDeRespuesta(Long idRespuesta, String idUsuarioAutenticado) {
        if (idRespuesta == null || idUsuarioAutenticado == null) {
            return false;
        }
        return respuestaRepository.findById(idRespuesta)
                .map(r -> idUsuarioAutenticado.equals(r.getPostulacion().getUsuario().getId().toString()))
                .orElse(false);
    }
}
