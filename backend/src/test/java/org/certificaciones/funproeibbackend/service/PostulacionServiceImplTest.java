package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.PostulacionRequest;
import org.certificaciones.funproeibbackend.dto.PostulacionResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.repository.ListaNegraRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.impl.PostulacionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostulacionService - reglas de negocio de postulación")
class PostulacionServiceImplTest {

    @Mock private PostulacionRepository postulacionRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ProgramaRepository programaRepository;
    @Mock private ListaNegraRepository listaNegraRepository;

    @InjectMocks private PostulacionServiceImpl service;

    private Usuario usuario;
    private Programa programa;
    private PostulacionRequest request;

    @BeforeEach
    void setUp() {
        usuario = Usuario.builder().id(1L).ci("123456").nombreCompleto("Juan Mamani").build();
        programa = Programa.builder().id(2L).nombre("Diplomado EIB")
                .estado(EstadoPrograma.ABIERTO).cuposDisponibles(10).build();
        request = new PostulacionRequest();
        request.setIdUsuario(1L);
        request.setIdPrograma(2L);
    }

    @Test
    @DisplayName("Crea la postulación en estado INCOMPLETA cuando todo es válido")
    void crear_exito_estadoIncompleta() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(programaRepository.findById(2L)).thenReturn(Optional.of(programa));
        when(listaNegraRepository.existsByCiPostulanteAndActivoTrue("123456")).thenReturn(false);
        when(postulacionRepository.existsByUsuarioIdAndProgramaId(1L, 2L)).thenReturn(false);
        when(postulacionRepository.save(any(Postulacion.class))).thenAnswer(inv -> inv.getArgument(0));

        PostulacionResponse res = service.crear(request);

        assertThat(res.getEstado()).isEqualTo(EstadoPostulacion.INCOMPLETA);
        assertThat(res.getNombrePostulante()).isEqualTo("Juan Mamani");
        verify(postulacionRepository).save(any(Postulacion.class));
    }

    @Test
    @DisplayName("Rechaza si el postulante está en lista negra")
    void crear_listaNegra_lanzaExcepcion() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(programaRepository.findById(2L)).thenReturn(Optional.of(programa));
        when(listaNegraRepository.existsByCiPostulanteAndActivoTrue("123456")).thenReturn(true);

        assertThatThrownBy(() -> service.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("lista negra");
        verify(postulacionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza si el programa no está ABIERTO")
    void crear_programaNoAbierto_lanzaExcepcion() {
        programa.setEstado(EstadoPrograma.BORRADOR);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(programaRepository.findById(2L)).thenReturn(Optional.of(programa));
        when(listaNegraRepository.existsByCiPostulanteAndActivoTrue("123456")).thenReturn(false);

        assertThatThrownBy(() -> service.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no está abierto");
    }

    @Test
    @DisplayName("Rechaza si no hay cupos disponibles")
    void crear_sinCupos_lanzaExcepcion() {
        programa.setCuposDisponibles(0);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(programaRepository.findById(2L)).thenReturn(Optional.of(programa));
        when(listaNegraRepository.existsByCiPostulanteAndActivoTrue("123456")).thenReturn(false);

        assertThatThrownBy(() -> service.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cupos");
    }

    @Test
    @DisplayName("Rechaza si el usuario ya postuló al mismo programa")
    void crear_duplicado_lanzaExcepcion() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(programaRepository.findById(2L)).thenReturn(Optional.of(programa));
        when(listaNegraRepository.existsByCiPostulanteAndActivoTrue("123456")).thenReturn(false);
        when(postulacionRepository.existsByUsuarioIdAndProgramaId(1L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> service.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya tiene una postulación");
    }
}
