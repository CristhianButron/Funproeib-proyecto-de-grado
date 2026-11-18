package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ProgramaRequest;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.repository.ReqDocumentoRepository;
import org.certificaciones.funproeibbackend.service.impl.ProgramaServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProgramaService - cierre automático por fechaFin")
class ProgramaServiceImplTest {

    @Mock private ProgramaRepository programaRepository;
    @Mock private ReqDocumentoRepository reqDocumentoRepository;

    @InjectMocks private ProgramaServiceImpl service;

    private Programa vencidoActivo;
    private Programa vencidoAbierto;

    @BeforeEach
    void setUp() {
        vencidoActivo = Programa.builder()
                .id(1L).nombre("Diplomado A").tipo(TipoPrograma.DIPLOMADO)
                .fechaInicio(LocalDate.now().minusMonths(2))
                .fechaFin(LocalDate.now().minusDays(1))
                .cuposDisponibles(20)
                .estado(EstadoPrograma.ACTIVO)
                .build();

        vencidoAbierto = Programa.builder()
                .id(2L).nombre("Taller B").tipo(TipoPrograma.TALLER)
                .fechaInicio(LocalDate.now().minusMonths(1))
                .fechaFin(LocalDate.now().minusDays(3))
                .cuposDisponibles(15)
                .estado(EstadoPrograma.ABIERTO)
                .build();
    }

    @Test
    @DisplayName("cierra todos los programas cuya fechaFin ya pasó y no estaban CERRADO")
    void cerrarProgramasFinalizados_marcaComoCerradoLosVencidos() {
        when(programaRepository.findByFechaFinBeforeAndEstadoNot(any(LocalDate.class), eq(EstadoPrograma.CERRADO)))
                .thenReturn(List.of(vencidoActivo, vencidoAbierto));

        int cerrados = service.cerrarProgramasFinalizados();

        assertThat(cerrados).isEqualTo(2);
        assertThat(vencidoActivo.getEstado()).isEqualTo(EstadoPrograma.CERRADO);
        assertThat(vencidoAbierto.getEstado()).isEqualTo(EstadoPrograma.CERRADO);

        ArgumentCaptor<List<Programa>> captor = ArgumentCaptor.forClass(List.class);
        verify(programaRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).containsExactlyInAnyOrder(vencidoActivo, vencidoAbierto);
    }

    @Test
    @DisplayName("no hace nada cuando no hay programas vencidos")
    void cerrarProgramasFinalizados_sinVencidos_noModificaNada() {
        when(programaRepository.findByFechaFinBeforeAndEstadoNot(any(LocalDate.class), eq(EstadoPrograma.CERRADO)))
                .thenReturn(List.of());

        int cerrados = service.cerrarProgramasFinalizados();

        assertThat(cerrados).isZero();
        verify(programaRepository).saveAll(List.of());
    }

    @Test
    @DisplayName("al crear un programa, genera automáticamente los 2 requisitos de carnet de identidad (solo imagen)")
    void crear_generaRequisitosDeIdentidadAutomaticamente() {
        ProgramaRequest request = new ProgramaRequest();
        request.setNombre("Diplomado C");
        request.setTipo(TipoPrograma.DIPLOMADO);
        request.setFechaInicio(LocalDate.now());
        request.setFechaFin(LocalDate.now().plusMonths(3));
        request.setCuposDisponibles(30);

        Programa guardado = Programa.builder()
                .id(10L).nombre("Diplomado C").tipo(TipoPrograma.DIPLOMADO)
                .fechaInicio(request.getFechaInicio()).fechaFin(request.getFechaFin())
                .cuposDisponibles(30).estado(EstadoPrograma.BORRADOR)
                .build();
        when(programaRepository.save(any(Programa.class))).thenReturn(guardado);

        service.crear(request);

        ArgumentCaptor<List<ReqDocumento>> captor = ArgumentCaptor.forClass(List.class);
        verify(reqDocumentoRepository).saveAll(captor.capture());
        List<ReqDocumento> requisitos = captor.getValue();

        assertThat(requisitos).hasSize(2);
        assertThat(requisitos).extracting(ReqDocumento::getNombreDocumento)
                .containsExactlyInAnyOrder("Carnet de identidad - anverso", "Carnet de identidad - reverso");
        assertThat(requisitos).allSatisfy(r -> {
            assertThat(r.getObligatorio()).isTrue();
            assertThat(r.getSoloImagen()).isTrue();
            assertThat(r.getTipoPermitido()).isEqualTo(TipoDocumento.PDF);
            assertThat(r.getPrograma()).isEqualTo(guardado);
        });
    }
}
