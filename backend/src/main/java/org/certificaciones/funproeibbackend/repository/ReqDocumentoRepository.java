package org.certificaciones.funproeibbackend.repository;

import org.certificaciones.funproeibbackend.model.ReqDocumento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReqDocumentoRepository extends JpaRepository<ReqDocumento, Long> {

    List<ReqDocumento> findByProgramaId(Long idPrograma);

    List<ReqDocumento> findByProgramaIdAndObligatorioTrue(Long idPrograma);
}