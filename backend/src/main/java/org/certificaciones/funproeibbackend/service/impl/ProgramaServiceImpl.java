package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.ProgramaRequest;
import org.certificaciones.funproeibbackend.dto.ProgramaResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.repository.ReqDocumentoRepository;
import org.certificaciones.funproeibbackend.service.ProgramaService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgramaServiceImpl implements ProgramaService {

    private static final Logger log = LoggerFactory.getLogger(ProgramaServiceImpl.class);

    private final ProgramaRepository programaRepository;
    private final ReqDocumentoRepository reqDocumentoRepository;

    @Override
    @Transactional
    public ProgramaResponse crear(ProgramaRequest request) {
        if (request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new BusinessException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }

        Programa programa = Programa.builder()
                .nombre(request.getNombre())
                .tipo(request.getTipo())
                .edicion(request.getEdicion())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .cuposDisponibles(request.getCuposDisponibles())
                .estado(EstadoPrograma.BORRADOR) // todo programa nace en borrador
                .build();

        Programa guardado = programaRepository.save(programa);
        crearRequisitosDeIdentidad(guardado);

        return mapToResponse(guardado);
    }

    // Todo programa exige verificar la identidad del postulante antes de
    // pasar a evaluación (ver EvaluacionServiceImpl), así que estos dos
    // requisitos de documento se crean solos -el admin no tiene que
    // acordarse de agregarlos a mano en cada programa nuevo. Solo aceptan
    // JPG/PNG (ver ReqDocumento.soloImagen y DocumentoServiceImpl).
    private void crearRequisitosDeIdentidad(Programa programa) {
        reqDocumentoRepository.saveAll(List.of(
                ReqDocumento.builder()
                        .programa(programa)
                        .nombreDocumento("Carnet de identidad - anverso")
                        .descripcion("Foto o escaneo del frente de tu carnet de identidad, en JPG o PNG")
                        .obligatorio(true)
                        .tipoPermitido(TipoDocumento.PDF)
                        .soloImagen(true)
                        .build(),
                ReqDocumento.builder()
                        .programa(programa)
                        .nombreDocumento("Carnet de identidad - reverso")
                        .descripcion("Foto o escaneo del reverso de tu carnet de identidad, en JPG o PNG")
                        .obligatorio(true)
                        .tipoPermitido(TipoDocumento.PDF)
                        .soloImagen(true)
                        .build()));
    }

    @Override
    public ProgramaResponse obtenerPorId(Long id) {
        return mapToResponse(buscarPrograma(id));
    }

    @Override
    public List<ProgramaResponse> listarTodos() {
        return programaRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public ProgramaResponse actualizar(Long id, ProgramaRequest request) {
        Programa programa = buscarPrograma(id);

        programa.setNombre(request.getNombre());
        programa.setTipo(request.getTipo());
        programa.setEdicion(request.getEdicion());
        programa.setFechaInicio(request.getFechaInicio());
        programa.setFechaFin(request.getFechaFin());
        programa.setCuposDisponibles(request.getCuposDisponibles());

        return mapToResponse(programaRepository.save(programa));
    }

    @Override
    @Transactional
    public ProgramaResponse cambiarEstado(Long id, String nuevoEstado) {
        Programa programa = buscarPrograma(id);
        try {
            programa.setEstado(EstadoPrograma.valueOf(nuevoEstado.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Estado no válido: " + nuevoEstado);
        }
        return mapToResponse(programaRepository.save(programa));
    }

    @Override
    @Transactional
    public int cerrarProgramasFinalizados() {
        List<Programa> vencidos = programaRepository.findByFechaFinBeforeAndEstadoNot(LocalDate.now(), EstadoPrograma.CERRADO);
        vencidos.forEach(p -> p.setEstado(EstadoPrograma.CERRADO));
        programaRepository.saveAll(vencidos);
        if (!vencidos.isEmpty()) {
            log.info("Cierre automático: {} programa(s) marcados como CERRADO por fecha de fin vencida", vencidos.size());
        }
        return vencidos.size();
    }

    private Programa buscarPrograma(Long id) {
        return programaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Programa no encontrado con id: " + id));
    }

    private ProgramaResponse mapToResponse(Programa programa) {
        return ProgramaResponse.builder()
                .id(programa.getId())
                .nombre(programa.getNombre())
                .tipo(programa.getTipo())
                .edicion(programa.getEdicion())
                .fechaInicio(programa.getFechaInicio())
                .fechaFin(programa.getFechaFin())
                .cuposDisponibles(programa.getCuposDisponibles())
                .estado(programa.getEstado())
                .build();
    }
}