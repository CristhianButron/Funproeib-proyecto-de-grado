package org.certificaciones.funproeibbackend.model;

import org.certificaciones.funproeibbackend.model.enums.TipoDocumento;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "req_documento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReqDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_req_doc")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_programa", nullable = false)
    private Programa programa;

    @Column(name = "nombre_documento", nullable = false, length = 150)
    private String nombreDocumento;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "obligatorio")
    @Builder.Default
    private Boolean obligatorio = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_permitido", length = 20)
    private TipoDocumento tipoPermitido;
}