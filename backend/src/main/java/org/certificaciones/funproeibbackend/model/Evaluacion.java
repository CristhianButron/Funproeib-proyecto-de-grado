package org.certificaciones.funproeibbackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "evaluacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evaluacion")
    private Long id;

    // Relación 1 a 1: cada postulación tiene una sola evaluación
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_postulacion", nullable = false, unique = true)
    private Postulacion postulacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario evaluador;

    @Column(name = "fecha_evaluacion", nullable = false)
    private LocalDate fechaEvaluacion;

    // precisión 5 para admitir hasta 100.00 (puntaje siempre normalizado sobre 100)
    @Column(name = "puntaje_total", precision = 5, scale = 2)
    private BigDecimal puntajeTotal;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
}