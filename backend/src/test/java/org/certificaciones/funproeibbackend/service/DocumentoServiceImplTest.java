package org.certificaciones.funproeibbackend.service;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.dto.DocumentoRequest;
import org.certificaciones.funproeibbackend.dto.DocumentoResponse;
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
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
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

    @TempDir
    Path carpetaSubidas;

    private Programa programa;
    private Postulacion postulacion;
    private ReqDocumento reqArchivo;
    private ReqDocumento reqEnlace;
    private DocumentoRequest request;

    @BeforeEach
    void setUp() {
        programa = Programa.builder().id(2L).nombre("Diplomado EIB").build();
        postulacion = Postulacion.builder().id(5L).programa(programa)
                .estado(EstadoPostulacion.INCOMPLETA).build();
        reqArchivo = ReqDocumento.builder().id(7L).programa(programa)
                .nombreDocumento("Hoja de vida").obligatorio(true)
                .tipoPermitido(TipoDocumento.PDF).build();
        reqEnlace = ReqDocumento.builder().id(8L).programa(programa)
                .nombreDocumento("Carta de recomendación").obligatorio(false)
                .tipoPermitido(TipoDocumento.ENLACE).build();

        request = new DocumentoRequest();
        request.setIdPostulacion(5L);
        request.setIdReqDocumento(7L);
        request.setRutaArchivo("hoja-vida.pdf");
        request.setTipo(TipoDocumento.PDF);

        ReflectionTestUtils.setField(service, "uploadsDir", carpetaSubidas.toString());
    }

    @Test
    @DisplayName("Rechaza si el tipo de archivo no coincide con el permitido")
    void registrar_tipoNoPermitido_lanzaExcepcion() {
        request.setTipo(TipoDocumento.ENLACE); // requisito exige PDF
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findById(7L)).thenReturn(Optional.of(reqArchivo));

        assertThatThrownBy(() -> service.registrar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("tipo");
        verify(documentoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Al registrar un documento válido, guarda y dispara la revisión de completitud")
    void registrar_valido_guardaYRevisaCompletitud() {
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findById(7L)).thenReturn(Optional.of(reqArchivo));
        when(documentoRepository.save(any(Documento.class))).thenAnswer(inv -> inv.getArgument(0));

        service.registrar(request);

        verify(documentoRepository).save(any(Documento.class));
        verify(completitudService).revisar(5L);
    }

    @Test
    @DisplayName("Sube un archivo válido, lo guarda en disco y dispara la revisión de completitud")
    void subirArchivo_valido_guardaEnDiscoYRevisaCompletitud() {
        MockMultipartFile archivo = new MockMultipartFile("archivo", "hoja-vida.pdf", "application/pdf", "contenido".getBytes());
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findById(7L)).thenReturn(Optional.of(reqArchivo));
        when(documentoRepository.save(any(Documento.class))).thenAnswer(inv -> inv.getArgument(0));

        DocumentoResponse res = service.subirArchivo(5L, 7L, archivo);

        assertThat(res.getRutaArchivo()).startsWith("postulacion-5/").endsWith("hoja-vida.pdf");
        assertThat(carpetaSubidas.resolve(res.getRutaArchivo())).exists();
        verify(completitudService).revisar(5L);
    }

    @Test
    @DisplayName("Rechaza una extensión de archivo no permitida")
    void subirArchivo_extensionNoPermitida_lanzaExcepcion() {
        MockMultipartFile archivo = new MockMultipartFile("archivo", "virus.exe", "application/octet-stream", "x".getBytes());
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findById(7L)).thenReturn(Optional.of(reqArchivo));

        assertThatThrownBy(() -> service.subirArchivo(5L, 7L, archivo))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no permitido");
        verify(documentoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza subir un archivo si el requisito espera un enlace")
    void subirArchivo_requisitoEsperaEnlace_lanzaExcepcion() {
        MockMultipartFile archivo = new MockMultipartFile("archivo", "carta.pdf", "application/pdf", "x".getBytes());
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findById(8L)).thenReturn(Optional.of(reqEnlace));

        assertThatThrownBy(() -> service.subirArchivo(5L, 8L, archivo))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("enlace");
        verify(documentoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Descarga un archivo previamente subido")
    void descargar_archivoExistente_devuelveRecurso() {
        MockMultipartFile archivo = new MockMultipartFile("archivo", "hoja-vida.pdf", "application/pdf", "contenido".getBytes());
        when(postulacionRepository.findById(5L)).thenReturn(Optional.of(postulacion));
        when(reqDocumentoRepository.findById(7L)).thenReturn(Optional.of(reqArchivo));

        ArgumentCaptor<Documento> captor = ArgumentCaptor.forClass(Documento.class);
        when(documentoRepository.save(captor.capture())).thenAnswer(inv -> {
            Documento d = inv.getArgument(0);
            d.setId(99L);
            return d;
        });
        DocumentoResponse subido = service.subirArchivo(5L, 7L, archivo);

        when(documentoRepository.findById(99L)).thenReturn(Optional.of(captor.getValue()));

        ArchivoDescargable descargado = service.descargar(subido.getId());

        assertThat(descargado.getNombreArchivo()).isEqualTo("hoja-vida.pdf");
        assertThat(descargado.getContentType()).isEqualTo("application/pdf");
    }

    @Test
    @DisplayName("Rechaza descargar un documento que es un enlace, no un archivo")
    void descargar_documentoEsEnlace_lanzaExcepcion() {
        Documento documentoEnlace = Documento.builder().id(10L).postulacion(postulacion).reqDocumento(reqEnlace)
                .rutaArchivo("https://ejemplo.com/carta.pdf").tipo(TipoDocumento.ENLACE).build();
        when(documentoRepository.findById(10L)).thenReturn(Optional.of(documentoEnlace));

        assertThatThrownBy(() -> service.descargar(10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("enlace");
    }
}
