package org.certificaciones.funproeibbackend.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Catálogo fijo de criterios de evaluación de postulaciones, estandarizado
 * según el documento "Criterios de evaluación de postulaciones" de Funproeib
 * Andes: 6 criterios, cada uno calificado de 1 a 10, puntaje total sobre 60.
 * No depende de un programa específico: se usa igual en todos.
 */
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

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "nombre_criterio", nullable = false, length = 150)
    private String nombreCriterio;

    @Column(name = "descripcion", length = 500)
    private String descripcion;
}
