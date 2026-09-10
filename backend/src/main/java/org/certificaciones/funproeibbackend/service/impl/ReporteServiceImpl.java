package org.certificaciones.funproeibbackend.service.impl;

import org.certificaciones.funproeibbackend.dto.BeneficiarioReporteResponse;
import org.certificaciones.funproeibbackend.dto.ReporteBeneficiariosFiltro;
import org.certificaciones.funproeibbackend.model.Postulacion;
import org.certificaciones.funproeibbackend.model.Programa;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.repository.PostulacionRepository;
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

    @Override
    @Transactional(readOnly = true)
    public List<BeneficiarioReporteResponse> listarBeneficiarios(ReporteBeneficiariosFiltro filtro) {
        return postulacionRepository.buscarBeneficiarios(
                        filtro.getTipoPrograma(),
                        filtro.getIdPrograma(),
                        filtro.getGenero(),
                        filtro.getNivelEducativo(),
                        filtro.getIdPais(),
                        filtro.getIdCiudad(),
                        filtro.getFechaDesde(),
                        filtro.getFechaHasta())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private BeneficiarioReporteResponse mapToResponse(Postulacion p) {
        Usuario u = p.getUsuario();
        Programa pr = p.getPrograma();

        Integer edad = null;
        if (u.getFechaNacimiento() != null) {
            edad = Period.between(u.getFechaNacimiento(), LocalDate.now()).getYears();
        }

        return BeneficiarioReporteResponse.builder()
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
                .pais(u.getCiudad() != null && u.getCiudad().getPais() != null ? u.getCiudad().getPais().getNombre() : null)
                .ciudad(u.getCiudad() != null ? u.getCiudad().getNombre() : null)
                .idPrograma(pr.getId())
                .nombrePrograma(pr.getNombre())
                .tipoPrograma(pr.getTipo())
                .edicion(pr.getEdicion())
                .fechaPostulacion(p.getFechaPostulacion())
                .fechaFinPrograma(pr.getFechaFin())
                .build();
    }
}
