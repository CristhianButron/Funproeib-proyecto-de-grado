package org.certificaciones.funproeibbackend.config;

import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DataInitializer - siembra de cuentas de prueba (ADMIN/EVALUADOR/POSTULANTE)")
class DataInitializerTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private CiudadRepository ciudadRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        dataInitializer = new DataInitializer(usuarioRepository, ciudadRepository, passwordEncoder);
        lenient().when(ciudadRepository.findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase("La Paz", "Bolivia"))
                .thenReturn(Optional.empty());
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("HASH");
        lenient().when(usuarioRepository.findByRolIn(any())).thenReturn(List.of());
    }

    @Test
    @DisplayName("Si ninguna cuenta existe, siembra ADMIN, EVALUADOR y POSTULANTE")
    void run_sinCuentasPrevias_siembraLasTres() {
        when(usuarioRepository.existsByCorreo(anyString())).thenReturn(false);

        dataInitializer.run();

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository, times(3)).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(Usuario::getRol)
                .containsExactlyInAnyOrder(RolUsuario.ADMIN, RolUsuario.EVALUADOR, RolUsuario.POSTULANTE);
    }

    @Test
    @DisplayName("El EVALUADOR y el POSTULANTE sembrados quedan con la identidad ya verificada")
    void run_cuentasSembradas_quedanConIdentidadVerificada() {
        when(usuarioRepository.existsByCorreo(anyString())).thenReturn(false);

        dataInitializer.run();

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository, times(3)).save(captor.capture());
        assertThat(captor.getAllValues()).allSatisfy(u -> assertThat(u.getIdentidadVerificada()).isTrue());
    }

    @Test
    @DisplayName("Si las tres cuentas ya existen, no vuelve a crear ninguna")
    void run_cuentasYaExisten_noCreaNinguna() {
        when(usuarioRepository.existsByCorreo(anyString())).thenReturn(true);

        dataInitializer.run();

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("El backfill marca como verificados a los ADMIN/EVALUADOR sembrados antes de este campo")
    void run_backfillMarcaStaffSinVerificarComoVerificado() {
        when(usuarioRepository.existsByCorreo(anyString())).thenReturn(true);
        Usuario staffViejo = Usuario.builder().id(99L).rol(RolUsuario.EVALUADOR).identidadVerificada(null).build();
        when(usuarioRepository.findByRolIn(List.of(RolUsuario.ADMIN, RolUsuario.EVALUADOR)))
                .thenReturn(List.of(staffViejo));

        dataInitializer.run();

        assertThat(staffViejo.getIdentidadVerificada()).isTrue();
        verify(usuarioRepository).saveAll(List.of(staffViejo));
    }
}
