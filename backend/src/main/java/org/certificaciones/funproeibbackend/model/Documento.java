package org.certificaciones.funproeibbackend.model;

import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "documento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_documento")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_postulacion", nullable = false)
    private Postulacion postulacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_req_doc", nullable = false)
    private ReqDocumento reqDocumento;

    @Column(name = "ruta_archivo", length = 255)
    private String rutaArchivo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", length = 10)
    private TipoDocumento tipo;

    @Column(name = "fecha_carga", nullable = false)
    private LocalDate fechaCarga;

    @Column(name = "verificado")
    @Builder.Default
    private Boolean verificado = false;
}