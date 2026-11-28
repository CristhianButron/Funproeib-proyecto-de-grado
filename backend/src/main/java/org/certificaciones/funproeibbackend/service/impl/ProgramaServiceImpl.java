package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.ProgramaRequest;
import org.certificaciones.funproeibbackend.dto.ProgramaResponse;
import org.certificaciones.funproeibbackend.exception.BusinessException;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.ProgramaRepository;
import org.certificaciones.funproeibbackend.service.ProgramaService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgramaServiceImpl implements ProgramaService {

    private static final Logger log = LoggerFactory.getLogger(ProgramaServiceImpl.class);

    private final ProgramaRepository programaRepository;
    private final PostulacionRepository postulacionRepository;

    @Override
    @Transactional
    public ProgramaResponse crear(ProgramaRequest request) {
        validarFechas(request.getFechaInicio(), request.getFechaFin(),
                "La fecha de fin no puede ser anterior a hoy: no tiene sentido crear un programa que ya terminó");

        Programa programa = Programa.builder()
                .nombre(request.getNombre())
                .tipo(request.getTipo())
                .edicion(request.getEdicion())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .cuposDisponibles(request.getCuposDisponibles())
                .estado(EstadoPrograma.BORRADOR) // todo programa nace en borrador
                .descripcion(request.getDescripcion())
                .modulos(request.getModulos() != null ? new ArrayList<>(request.getModulos()) : new ArrayList<>())
                .build();

        return mapToResponse(programaRepository.save(programa));
    }

    @Override
    @Transactional(readOnly = true)
    public ProgramaResponse obtenerPorId(Long id) {
        return mapToResponse(buscarPrograma(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgramaResponse> listarTodos() {
        List<Programa> programas = programaRepository.findAll();
        if (programas.isEmpty()) {
            return List.of();
        }

        // Una consulta agrupada por cada conteo (en vez de 2 por programa):
        // evita el N+1 que tenía mapToResponse al llamarse una vez por fila.
        List<Long> ids = programas.stream().map(Programa::getId).toList();
        Map<Long, Long> totalPostulantes = agruparPorPrograma(postulacionRepository.contarPorPrograma(ids));
        Map<Long, Long> totalBeneficiarios = agruparPorPrograma(
                postulacionRepository.contarPorProgramaYEstado(ids, EstadoPostulacion.ACEPTADA));

        return programas.stream()
                .map(p -> mapToResponse(p,
                        totalPostulantes.getOrDefault(p.getId(), 0L),
                        totalBeneficiarios.getOrDefault(p.getId(), 0L)))
                .toList();
    }

    private Map<Long, Long> agruparPorPrograma(List<Object[]> filas) {
        return filas.stream().collect(Collectors.toMap(fila -> (Long) fila[0], fila -> (Long) fila[1]));
    }

    @Override
    @Transactional
    public ProgramaResponse actualizar(Long id, ProgramaRequest request) {
        Programa programa = buscarPrograma(id);

        validarFechas(request.getFechaInicio(), request.getFechaFin(), "La fecha de fin no puede ser anterior a hoy");

        programa.setNombre(request.getNombre());
        programa.setTipo(request.getTipo());
        programa.setEdicion(request.getEdicion());
        programa.setFechaInicio(request.getFechaInicio());
        programa.setFechaFin(request.getFechaFin());
        programa.setCuposDisponibles(request.getCuposDisponibles());
        programa.setDescripcion(request.getDescripcion());
        programa.setModulos(request.getModulos() != null ? new ArrayList<>(request.getModulos()) : new ArrayList<>());

        return mapToResponse(programaRepository.save(programa));
    }

    @Override
    @Transactional
    public ProgramaResponse cambiarEstado(Long id, String nuevoEstado) {
        Programa programa = buscarPrograma(id);
        EstadoPrograma estado;
        try {
            estado = EstadoPrograma.valueOf(nuevoEstado.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Estado no válido: " + nuevoEstado);
        }
        // Encontramos programas que quedaban ABIERTO/ACTIVO con su fecha de fin
        // ya vencida (el cierre automático nocturno -ver ProgramaEstadoScheduler-
        // los agarra recién al otro día). Esto lo bloquea en el momento.
        if ((estado == EstadoPrograma.ABIERTO || estado == EstadoPrograma.ACTIVO)
                && programa.getFechaFin().isBefore(LocalDate.now())) {
            throw new BusinessException("No se puede abrir/activar un programa cuya fecha de fin ya pasó");
        }
        programa.setEstado(estado);
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

    private void validarFechas(LocalDate fechaInicio, LocalDate fechaFin, String mensajeFechaFinPasada) {
        if (fechaFin.isBefore(fechaInicio)) {
            throw new BusinessException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
        if (fechaFin.isBefore(LocalDate.now())) {
            throw new BusinessException(mensajeFechaFinPasada);
        }
    }

    private ProgramaResponse mapToResponse(Programa programa) {
        return mapToResponse(programa,
                postulacionRepository.countByProgramaId(programa.getId()),
                postulacionRepository.countByProgramaIdAndEstado(programa.getId(), EstadoPostulacion.ACEPTADA));
    }

    private ProgramaResponse mapToResponse(Programa programa, long totalPostulantes, long totalBeneficiarios) {
        return ProgramaResponse.builder()
                .id(programa.getId())
                .nombre(programa.getNombre())
                .tipo(programa.getTipo())
                .edicion(programa.getEdicion())
                .fechaInicio(programa.getFechaInicio())
                .fechaFin(programa.getFechaFin())
                .cuposDisponibles(programa.getCuposDisponibles())
                .estado(programa.getEstado())
                .descripcion(programa.getDescripcion())
                .modulos(List.copyOf(programa.getModulos()))
                .totalPostulantes(totalPostulantes)
                .totalBeneficiarios(totalBeneficiarios)
                .build();
    }
}