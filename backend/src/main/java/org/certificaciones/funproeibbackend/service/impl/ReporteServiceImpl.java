package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.InscritoReporteResponse;
import org.certificaciones.funproeibbackend.dto.ReporteInscritosFiltro;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import org.certificaciones.funproeibbackend.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReporteServiceImpl implements ReporteService {

    private final PostulacionRepository postulacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<InscritoReporteResponse> listarInscritos(ReporteInscritosFiltro filtro) {
        return postulacionRepository.buscarParaReporte(
                        filtro.getTipoPrograma(),
                        filtro.getIdPrograma(),
                        filtro.getEstado(),
                        filtro.getGenero(),
                        filtro.getNivelEducativo(),
                        filtro.getPaisOrigen(),
                        filtro.getDepartamentoOrigen(),
                        filtro.getFechaDesde(),
                        filtro.getFechaHasta())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listarPaisesDisponibles() {
        return usuarioRepository.buscarPaisesDistintos();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listarDepartamentosDisponibles() {
        return usuarioRepository.buscarDepartamentosDistintos();
    }

    private InscritoReporteResponse mapToResponse(Postulacion p) {
        Usuario u = p.getUsuario();
        Programa pr = p.getPrograma();

        Integer edad = null;
        if (u.getFechaNacimiento() != null) {
            edad = Period.between(u.getFechaNacimiento(), LocalDate.now()).getYears();
        }

        return InscritoReporteResponse.builder()
                .idPostulacion(p.getId())
                .idUsuario(u.getId())
                .nombreCompleto(u.getNombreCompleto())
                .ci(u.getCi())
                .correo(u.getCorreo())
                .telefono(u.getTelefono())
                .genero(u.getGenero())
                .edad(edad)
                .fechaNacimiento(u.getFechaNacimiento())
                .nivelEducativo(u.getNivelEducativo())
                .autoidentificacionEtnica(u.getAutoidentificacionEtnica())
                .paisOrigen(u.getPaisOrigen())
                .departamentoOrigen(u.getDepartamentoOrigen())
                .municipioOrigen(u.getMunicipioOrigen())
                .idPrograma(pr.getId())
                .nombrePrograma(pr.getNombre())
                .tipoPrograma(pr.getTipo())
                .edicion(pr.getEdicion())
                .fechaPostulacion(p.getFechaPostulacion())
                .estado(p.getEstado())
                .build();
    }
}
