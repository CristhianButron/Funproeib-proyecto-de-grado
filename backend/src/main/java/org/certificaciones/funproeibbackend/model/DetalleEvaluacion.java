package org.certificaciones.funproeibbackend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "detalle_evaluacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetalleEvaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_evaluacion", nullable = false)
    private Evaluacion evaluacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_criterio", nullable = false)
    private CriterioEvaluacion criterio;

    @Column(name = "puntaje", nullable = false)
    private Integer puntaje; // escala 1 al 5
}