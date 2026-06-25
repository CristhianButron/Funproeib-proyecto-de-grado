package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.DocumentoRequest;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.model.Documento;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import org.certificaciones.funproeibbackend.repository.DocumentoRepository;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.ReqDocumentoRepository;
import org.certificaciones.funproeibbackend.service.impl.DocumentoServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentoService - carga de documentos")
class DocumentoServiceImplTest {

    @Mock private DocumentoRepository documentoRepository;
    @Mock private PostulacionRepository postulacionRepository;
    @Mock private ReqDocumentoRepository reqDocumentoRepository;
    @Mock private PostulacionCompletitudService completitudService;

    @InjectMocks private DocumentoServiceImpl service;

    private Programa programa;
    private Postulacion postulacion;
    private ReqDocumento reqObligatorio;
    private DocumentoRequest request;

    @BeforeEach
    void setUp() {
        programa = Programa.builder().id(2L).nombre("Diplomado EIB").build();
        postulacion = Postulacion.builder().id(5L).programa(programa)
                .estado(EstadoPostulacion.INCOMPLETA).build();
        reqObligatorio = ReqDocumento.builder().id(7L).programa(programa)
                .nombreDocumento("Hoja de vida").obligatorio(true)
                .tipoPermitido(TipoDocumento.PDF).build();

        request = new DocumentoRequest();
        request.setIdPostulacion(5L);
        request.setIdReqDocumento(7L);
        request.setRutaArchivo("hoja-vida.pdf");
        request.setTipo(TipoDocumento.PDF);
    }

    @Test
    @DisplayName("Rechaza si el tipo de archivo no coincide con el permitido")
    void registrar_tipoNoPermitido_lanzaExcepcion() {
        request.setTipo(TipoDocumento.ENLACE); // requisito exige PDF
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findById(7L)).thenReturn(Optional.of(reqObligatorio));

        assertThatThrownBy(() -> service.registrar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("tipo");
        verify(documentoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Al registrar un documento válido, guarda y dispara la revisión de completitud")
    void registrar_valido_guardaYRevisaCompletitud() {
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findById(7L)).thenReturn(Optional.of(reqObligatorio));
        when(documentoRepository.save(any(Documento.class))).thenAnswer(inv -> inv.getArgument(0));

        service.registrar(request);

        verify(documentoRepository).save(any(Documento.class));
        verify(completitudService).revisar(5L);
    }
}
