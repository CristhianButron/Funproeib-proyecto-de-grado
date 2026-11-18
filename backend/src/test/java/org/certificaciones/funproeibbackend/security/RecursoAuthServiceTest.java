package org.certificaciones.funproeibbackend.security;

import org.certificaciones.funproeibbackend.model.Documento;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.repository.DocumentoRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecursoAuthService - que un usuario solo acceda a SUS documentos/respuestas")
class RecursoAuthServiceTest {

    @Mock private PostulacionRepository postulacionRepository;
    @Mock private DocumentoRepository documentoRepository;

    @InjectMocks private RecursoAuthService service;

    @Test
    @DisplayName("esDuenoDePostulacion es true cuando el id autenticado es el del dueño")
    void esDuenoDePostulacion_dueno_devuelveTrue() {
        Usuario dueno = Usuario.builder().id(7L).build();
        Postulacion postulacion = Postulacion.builder().id(1L).usuario(dueno).build();
        when(postulacionRepository.findById(1L)).thenReturn(Optional.of(postulacion));

        assertThat(service.esDuenoDePostulacion(1L, "7")).isTrue();
    }

    @Test
    @DisplayName("esDuenoDePostulacion es false cuando el id autenticado es de otro usuario")
    void esDuenoDePostulacion_otroUsuario_devuelveFalse() {
        Usuario dueno = Usuario.builder().id(7L).build();
        Postulacion postulacion = Postulacion.builder().id(1L).usuario(dueno).build();
        when(postulacionRepository.findById(1L)).thenReturn(Optional.of(postulacion));

        assertThat(service.esDuenoDePostulacion(1L, "99")).isFalse();
    }

    @Test
    @DisplayName("esDuenoDePostulacion es false si la postulación no existe")
    void esDuenoDePostulacion_postulacionInexistente_devuelveFalse() {
        when(postulacionRepository.findById(404L)).thenReturn(Optional.empty());

        assertThat(service.esDuenoDePostulacion(404L, "7")).isFalse();
    }

    @Test
    @DisplayName("esDuenoDeDocumento resuelve el dueño a través de la postulación del documento")
    void esDuenoDeDocumento_dueno_devuelveTrue() {
        Usuario dueno = Usuario.builder().id(7L).build();
        Postulacion postulacion = Postulacion.builder().id(1L).usuario(dueno).build();
        Documento documento = Documento.builder().id(50L).postulacion(postulacion).build();
        when(documentoRepository.findById(50L)).thenReturn(Optional.of(documento));

        assertThat(service.esDuenoDeDocumento(50L, "7")).isTrue();
    }

    @Test
    @DisplayName("esDuenoDeDocumento es false cuando el id autenticado es de otro usuario")
    void esDuenoDeDocumento_otroUsuario_devuelveFalse() {
        Usuario dueno = Usuario.builder().id(7L).build();
        Postulacion postulacion = Postulacion.builder().id(1L).usuario(dueno).build();
        Documento documento = Documento.builder().id(50L).postulacion(postulacion).build();
        when(documentoRepository.findById(50L)).thenReturn(Optional.of(documento));

        assertThat(service.esDuenoDeDocumento(50L, "99")).isFalse();
    }

    @Test
    @DisplayName("esDuenoDeDocumento es false si el documento no existe")
    void esDuenoDeDocumento_documentoInexistente_devuelveFalse() {
        when(documentoRepository.findById(404L)).thenReturn(Optional.empty());

        assertThat(service.esDuenoDeDocumento(404L, "7")).isFalse();
    }
}
