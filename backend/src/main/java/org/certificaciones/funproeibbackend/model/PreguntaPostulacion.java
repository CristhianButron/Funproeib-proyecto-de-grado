package org.certificaciones.funproeibbackend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pregunta_postulacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreguntaPostulacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pregunta")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_programa", nullable = false)
    private Programa programa;

    @Column(name = "enunciado", nullable = false, length = 500)
    private String enunciado;

    @Column(name = "orden")
    @Builder.Default
    private Integer orden = 1;
}
