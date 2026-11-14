package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.CiudadResponse;
import org.certificaciones.funproeibbackend.dto.PaisResponse;
import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Pais;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.PaisRepository;
import org.certificaciones.funproeibbackend.service.impl.UbicacionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UbicacionService - catálogo de países y ciudades")
class UbicacionServiceImplTest {

    @Mock private PaisRepository paisRepository;
    @Mock private CiudadRepository ciudadRepository;

    private UbicacionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UbicacionServiceImpl(paisRepository, ciudadRepository);
    }

    @Test
    @DisplayName("listarPaises devuelve los países ordenados alfabéticamente")
    void listarPaises_devuelveLista() {
        when(paisRepository.findAllByOrderByNombreAsc()).thenReturn(
                List.of(Pais.builder().id(1L).nombre("Bolivia").build()));

        List<PaisResponse> res = service.listarPaises();

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getNombre()).isEqualTo("Bolivia");
    }

    @Test
    @DisplayName("listarCiudadesPorPais devuelve las ciudades con el nombre de su país")
    void listarCiudadesPorPais_devuelveLista() {
        Pais bolivia = Pais.builder().id(1L).nombre("Bolivia").build();
        when(ciudadRepository.findByPaisIdOrderByNombreAsc(1L)).thenReturn(
                List.of(Ciudad.builder().id(10L).nombre("La Paz").pais(bolivia).build()));

        List<CiudadResponse> res = service.listarCiudadesPorPais(1L);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getNombrePais()).isEqualTo("Bolivia");
    }
}
