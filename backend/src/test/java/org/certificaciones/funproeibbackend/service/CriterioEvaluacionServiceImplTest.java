package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionRequest;
import org.certificaciones.funproeibbackend.dto.CriterioEvaluacionResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.model.CriterioEvaluacion;
import org.certificaciones.funproeibbackend.repository.CriterioEvaluacionRepository;
import org.certificaciones.funproeibbackend.service.impl.CriterioEvaluacionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CriterioEvaluacionService - agregar, editar y desactivar criterios")
class CriterioEvaluacionServiceImplTest {

    @Mock private CriterioEvaluacionRepository criterioRepository;
    @InjectMocks private CriterioEvaluacionServiceImpl service;

    private CriterioEvaluacionRequest request;

    @BeforeEach
    void setUp() {
        request = new CriterioEvaluacionRequest();
        request.setNombreCriterio("Trabajo en equipo");
        request.setDescripcion("Capacidad de colaborar con otros.");
    }

    @Test
    @DisplayName("Crear asigna el siguiente orden disponible y queda activo")
    void crear_asignaOrdenSiguienteYActivo() {
        when(criterioRepository.existsByNombreCriterioIgnoreCase("Trabajo en equipo")).thenReturn(false);
        when(criterioRepository.findFirstByOrderByOrdenDesc())
                .thenReturn(Optional.of(CriterioEvaluacion.builder().id(6L).orden(6).build()));
        when(criterioRepository.save(any(CriterioEvaluacion.class))).thenAnswer(inv -> {
            CriterioEvaluacion c = inv.getArgument(0);
            c.setId(7L);
            return c;
        });

        CriterioEvaluacionResponse res = service.crear(request);

        assertThat(res.getOrden()).isEqualTo(7);
        assertThat(res.getActivo()).isTrue();
        assertThat(res.getNombreCriterio()).isEqualTo("Trabajo en equipo");
    }

    @Test
    @DisplayName("Crear el primer criterio (catálogo vacío) le asigna orden 1")
    void crear_catalogoVacio_asignaOrdenUno() {
        when(criterioRepository.existsByNombreCriterioIgnoreCase(anyString())).thenReturn(false);
        when(criterioRepository.findFirstByOrderByOrdenDesc()).thenReturn(Optional.empty());
        when(criterioRepository.save(any(CriterioEvaluacion.class))).thenAnswer(inv -> inv.getArgument(0));

        CriterioEvaluacionResponse res = service.crear(request);

        assertThat(res.getOrden()).isEqualTo(1);
    }

    @Test
    @DisplayName("Rechaza crear un criterio con un nombre ya existente")
    void crear_nombreDuplicado_lanzaExcepcion() {
        when(criterioRepository.existsByNombreCriterioIgnoreCase("Trabajo en equipo")).thenReturn(true);

        assertThatThrownBy(() -> service.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("nombre");
        verify(criterioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Actualizar cambia nombre y descripción sin tocar el orden")
    void actualizar_cambiaNombreYDescripcion() {
        CriterioEvaluacion existente = CriterioEvaluacion.builder()
                .id(3L).orden(3).nombreCriterio("Nombre viejo").descripcion("desc vieja").activo(true).build();
        when(criterioRepository.findById(3L)).thenReturn(Optional.of(existente));
        when(criterioRepository.existsByNombreCriterioIgnoreCase("Trabajo en equipo")).thenReturn(false);

        CriterioEvaluacionResponse res = service.actualizar(3L, request);

        assertThat(res.getNombreCriterio()).isEqualTo("Trabajo en equipo");
        assertThat(res.getDescripcion()).isEqualTo("Capacidad de colaborar con otros.");
        assertThat(res.getOrden()).isEqualTo(3);
    }

    @Test
    @DisplayName("Actualizar permite conservar el mismo nombre sin disparar el chequeo de duplicado")
    void actualizar_mismoNombre_noValidaDuplicado() {
        CriterioEvaluacion existente = CriterioEvaluacion.builder()
                .id(3L).orden(3).nombreCriterio("Trabajo en equipo").descripcion("vieja").activo(true).build();
        when(criterioRepository.findById(3L)).thenReturn(Optional.of(existente));

        service.actualizar(3L, request);

        verify(criterioRepository, never()).existsByNombreCriterioIgnoreCase(anyString());
    }

    @Test
    @DisplayName("Rechaza actualizar si el nuevo nombre ya lo usa otro criterio")
    void actualizar_nombreDeOtroCriterio_lanzaExcepcion() {
        CriterioEvaluacion existente = CriterioEvaluacion.builder()
                .id(3L).orden(3).nombreCriterio("Nombre viejo").activo(true).build();
        when(criterioRepository.findById(3L)).thenReturn(Optional.of(existente));
        when(criterioRepository.existsByNombreCriterioIgnoreCase("Trabajo en equipo")).thenReturn(true);

        assertThatThrownBy(() -> service.actualizar(3L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("nombre");
    }

    @Test
    @DisplayName("Permite desactivar un criterio si quedan otros activos")
    void cambiarActivo_hayOtrosActivos_permiteDesactivar() {
        CriterioEvaluacion criterio = CriterioEvaluacion.builder().id(3L).activo(true).build();
        when(criterioRepository.findById(3L)).thenReturn(Optional.of(criterio));
        when(criterioRepository.countByActivoTrue()).thenReturn(6L);

        CriterioEvaluacionResponse res = service.cambiarActivo(3L, false);

        assertThat(res.getActivo()).isFalse();
        verify(criterioRepository).save(criterio);
    }

    @Test
    @DisplayName("Rechaza desactivar el último criterio activo")
    void cambiarActivo_ultimoActivo_lanzaExcepcion() {
        CriterioEvaluacion criterio = CriterioEvaluacion.builder().id(3L).activo(true).build();
        when(criterioRepository.findById(3L)).thenReturn(Optional.of(criterio));
        when(criterioRepository.countByActivoTrue()).thenReturn(1L);

        assertThatThrownBy(() -> service.cambiarActivo(3L, false))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("al menos un criterio");
        verify(criterioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Reactivar un criterio no valida el mínimo de activos")
    void cambiarActivo_reactivar_noValida() {
        CriterioEvaluacion criterio = CriterioEvaluacion.builder().id(3L).activo(false).build();
        when(criterioRepository.findById(3L)).thenReturn(Optional.of(criterio));

        CriterioEvaluacionResponse res = service.cambiarActivo(3L, true);

        assertThat(res.getActivo()).isTrue();
        verify(criterioRepository, never()).countByActivoTrue();
    }

    @Test
    @DisplayName("listarActivos solo devuelve los criterios activos")
    void listarActivos_filtraInactivos() {
        List<CriterioEvaluacion> activos = List.of(
                CriterioEvaluacion.builder().id(1L).orden(1).nombreCriterio("A").activo(true).build()
        );
        when(criterioRepository.findByActivoTrueOrderByOrdenAsc()).thenReturn(activos);

        List<CriterioEvaluacionResponse> res = service.listarActivos();

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getNombreCriterio()).isEqualTo("A");
    }
}
