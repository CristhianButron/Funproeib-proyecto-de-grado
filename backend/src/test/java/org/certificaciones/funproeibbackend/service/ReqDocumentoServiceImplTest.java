package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ReqDocumentoRequest;
import org.certificaciones.funproeibbackend.dto.ReqDocumentoResponse;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.repository.ReqDocumentoRepository;
import org.certificaciones.funproeibbackend.service.impl.ReqDocumentoServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReqDocumentoService - requisitos documentales de un programa")
class ReqDocumentoServiceImplTest {

    @Mock private ReqDocumentoRepository reqDocumentoRepository;
    @Mock private ProgramaRepository programaRepository;

    private ReqDocumentoServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ReqDocumentoServiceImpl(reqDocumentoRepository, programaRepository);
    }

    @Test
    @DisplayName("Crear devuelve el requisito con el nombre del programa")
    void crear_devuelveConNombrePrograma() {
        Programa programa = Programa.builder().id(2L).nombre("Diplomado EIB").build();
        ReqDocumentoRequest request = new ReqDocumentoRequest();
        request.setIdPrograma(2L);
        request.setNombreDocumento("CI");
        request.setTipoPermitido(TipoDocumento.PDF);

        when(programaRepository.findById(2L)).thenReturn(Optional.of(programa));
        when(reqDocumentoRepository.save(any(ReqDocumento.class))).thenAnswer(inv -> inv.getArgument(0));

        ReqDocumentoResponse res = service.crear(request);

        assertThat(res.getNombrePrograma()).isEqualTo("Diplomado EIB");
        assertThat(res.getNombreDocumento()).isEqualTo("CI");
    }

    @Test
    @DisplayName("Rechaza crear si el programa no existe")
    void crear_programaInexistente_lanzaExcepcion() {
        ReqDocumentoRequest request = new ReqDocumentoRequest();
        request.setIdPrograma(99L);
        when(programaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.crear(request)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("listarPorPrograma devuelve los requisitos del programa")
    void listarPorPrograma_devuelveLista() {
        Programa programa = Programa.builder().id(2L).nombre("Diplomado EIB").build();
        ReqDocumento r = ReqDocumento.builder().id(1L).programa(programa).nombreDocumento("CI").tipoPermitido(TipoDocumento.PDF).build();
        when(reqDocumentoRepository.findByProgramaId(2L)).thenReturn(List.of(r));

        assertThat(service.listarPorPrograma(2L)).hasSize(1);
    }
}
