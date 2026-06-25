package org.certificaciones.funproeibbackend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "respuesta_postulacion",
       uniqueConstraints = @UniqueConstraint(columnNames = {"id_postulacion", "id_pregunta"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespuestaPostulacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_respuesta")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_postulacion", nullable = false)
    private Postulacion postulacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pregunta", nullable = false)
    private PreguntaPostulacion pregunta;

    @Column(name = "respuesta", columnDefinition = "TEXT")
    private String respuesta;
}
