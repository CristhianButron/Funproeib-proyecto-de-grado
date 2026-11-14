package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.BeneficiarioReporteResponse;
import org.certificaciones.funproeibbackend.dto.ReporteBeneficiariosFiltro;
import org.certificaciones.funproeibbackend.model.*;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.service.impl.ReporteServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReporteService - reporte de beneficiarios")
class ReporteServiceImplTest {

    @Mock private PostulacionRepository postulacionRepository;

    private ReporteServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ReporteServiceImpl(postulacionRepository);
    }

    @Test
    @DisplayName("Mapea un beneficiario con ciudad y país a la respuesta del reporte")
    void listarBeneficiarios_conCiudadYPais_mapeaCorrectamente() {
        Pais bolivia = Pais.builder().id(1L).nombre("Bolivia").build();
        Ciudad laPaz = Ciudad.builder().id(1L).nombre("La Paz").pais(bolivia).build();
        Usuario usuario = Usuario.builder().id(1L).nombre("Ana").apellidoPaterno("Quispe")
                .fechaNacimiento(LocalDate.of(2000, 1, 1)).ciudad(laPaz).build();
        Programa programa = Programa.builder().id(2L).nombre("Diplomado EIB").tipo(TipoPrograma.DIPLOMADO)
                .fechaFin(LocalDate.now().minusDays(1)).build();
        Postulacion postulacion = Postulacion.builder().id(5L).usuario(usuario).programa(programa)
                .estado(EstadoPostulacion.ACEPTADA).fechaPostulacion(LocalDate.now().minusMonths(3)).build();

        when(postulacionRepository.buscarBeneficiarios(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(postulacion));

        List<BeneficiarioReporteResponse> res = service.listarBeneficiarios(new ReporteBeneficiariosFiltro());

        assertThat(res).hasSize(1);
        BeneficiarioReporteResponse b = res.get(0);
        assertThat(b.getNombreCompleto()).isEqualTo("Ana Quispe");
        assertThat(b.getCiudad()).isEqualTo("La Paz");
        assertThat(b.getPais()).isEqualTo("Bolivia");
        assertThat(b.getEdad()).isEqualTo(java.time.Period.between(usuario.getFechaNacimiento(), LocalDate.now()).getYears());
    }

    @Test
    @DisplayName("Mapea un beneficiario sin ciudad asignada sin lanzar error")
    void listarBeneficiarios_sinCiudad_noFalla() {
        Usuario usuario = Usuario.builder().id(1L).nombre("Ana").apellidoPaterno("Quispe").build();
        Programa programa = Programa.builder().id(2L).nombre("Taller").tipo(TipoPrograma.TALLER)
                .fechaFin(LocalDate.now().minusDays(1)).build();
        Postulacion postulacion = Postulacion.builder().id(5L).usuario(usuario).programa(programa)
                .estado(EstadoPostulacion.ACEPTADA).fechaPostulacion(LocalDate.now()).build();

        when(postulacionRepository.buscarBeneficiarios(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(postulacion));

        List<BeneficiarioReporteResponse> res = service.listarBeneficiarios(new ReporteBeneficiariosFiltro());

        assertThat(res.get(0).getCiudad()).isNull();
        assertThat(res.get(0).getPais()).isNull();
        assertThat(res.get(0).getEdad()).isNull();
    }
}
