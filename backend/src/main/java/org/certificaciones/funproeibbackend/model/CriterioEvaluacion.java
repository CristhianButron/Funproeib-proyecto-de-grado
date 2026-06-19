package org.certificaciones.funproeibbackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "criterio_evaluacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CriterioEvaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_criterio")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_programa", nullable = false)
    private Programa programa;

    @Column(name = "nombre_criterio", nullable = false, length = 150)
    private String nombreCriterio;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "peso", precision = 4, scale = 2)
    private BigDecimal peso;
}