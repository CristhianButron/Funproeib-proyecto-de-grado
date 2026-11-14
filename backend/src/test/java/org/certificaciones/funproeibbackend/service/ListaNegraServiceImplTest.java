package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ListaNegraRequest;
import org.certificaciones.funproeibbackend.dto.ListaNegraResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.ListaNegra;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.MotivoListaNegra;
import org.certificaciones.funproeibbackend.repository.ListaNegraRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.impl.ListaNegraServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ListaNegraService - agregar, consultar y desactivar")
class ListaNegraServiceImplTest {

    @Mock private ListaNegraRepository listaNegraRepository;
    @Mock private UsuarioRepository usuarioRepository;

    private ListaNegraServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ListaNegraServiceImpl(listaNegraRepository, usuarioRepository);
    }

    private Usuario registrador() {
        return Usuario.builder().id(1L).nombre("Admin").apellidoPaterno("Funproeib").build();
    }

    @Test
    @DisplayName("Agregar crea el registro cuando el CI no está activo")
    void agregar_ciNoActivo_creaRegistro() {
        ListaNegraRequest request = new ListaNegraRequest();
        request.setCiPostulante("12345678");
        request.setMotivo(MotivoListaNegra.ABANDONO);
        request.setIdRegistradoPor(1L);

        when(listaNegraRepository.existsByCiPostulanteAndActivoTrue("12345678")).thenReturn(false);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(registrador()));
        when(listaNegraRepository.save(any(ListaNegra.class))).thenAnswer(inv -> inv.getArgument(0));

        ListaNegraResponse res = service.agregar(request);

        assertThat(res.getCiPostulante()).isEqualTo("12345678");
        assertThat(res.getActivo()).isTrue();
        assertThat(res.getRegistradoPorNombre()).isEqualTo("Admin Funproeib");
    }

    @Test
    @DisplayName("Rechaza agregar si el CI ya está activo en la lista negra")
    void agregar_ciYaActivo_lanzaExcepcion() {
        ListaNegraRequest request = new ListaNegraRequest();
        request.setCiPostulante("12345678");
        request.setMotivo(MotivoListaNegra.ABANDONO);
        request.setIdRegistradoPor(1L);

        when(listaNegraRepository.existsByCiPostulanteAndActivoTrue("12345678")).thenReturn(true);

        assertThatThrownBy(() -> service.agregar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya se encuentra activo");
        verify(listaNegraRepository, never()).save(any());
    }

    @Test
    @DisplayName("estaEnListaNegra delega directamente en el repositorio")
    void estaEnListaNegra_delegaEnRepositorio() {
        when(listaNegraRepository.existsByCiPostulanteAndActivoTrue("999")).thenReturn(true);

        assertThat(service.estaEnListaNegra("999")).isTrue();
    }

    @Test
    @DisplayName("listarActivos devuelve solo los registros activos mapeados")
    void listarActivos_devuelveMapeados() {
        ListaNegra ln = ListaNegra.builder().id(1L).ciPostulante("111").motivo(MotivoListaNegra.CONDUCTA)
                .fechaRegistro(LocalDate.now()).registradoPor(registrador()).activo(true).build();
        when(listaNegraRepository.findByActivoTrue()).thenReturn(List.of(ln));

        List<ListaNegraResponse> res = service.listarActivos();

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getCiPostulante()).isEqualTo("111");
    }

    @Test
    @DisplayName("Desactivar marca el registro como inactivo")
    void desactivar_marcaInactivo() {
        ListaNegra ln = ListaNegra.builder().id(1L).ciPostulante("111").registradoPor(registrador()).activo(true).build();
        when(listaNegraRepository.findById(1L)).thenReturn(Optional.of(ln));
        when(listaNegraRepository.save(any(ListaNegra.class))).thenAnswer(inv -> inv.getArgument(0));

        ListaNegraResponse res = service.desactivar(1L);

        assertThat(res.getActivo()).isFalse();
    }

    @Test
    @DisplayName("Rechaza desactivar una entrada que no existe")
    void desactivar_noExiste_lanzaExcepcion() {
        when(listaNegraRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.desactivar(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Rechaza desactivar una entrada ya desactivada")
    void desactivar_yaDesactivada_lanzaExcepcion() {
        ListaNegra ln = ListaNegra.builder().id(1L).registradoPor(registrador()).activo(false).build();
        when(listaNegraRepository.findById(1L)).thenReturn(Optional.of(ln));

        assertThatThrownBy(() -> service.desactivar(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya está desactivada");
    }
}
