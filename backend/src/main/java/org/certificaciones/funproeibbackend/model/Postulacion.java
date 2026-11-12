package org.certificaciones.funproeibbackend.model;

import org.certificaciones.funproeibbackend.model.enums.EstadoAprovechamiento;
import org.certificaciones.funproeibbackend.model.enums.EstadoPostulacion;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "postulacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Postulacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_postulacion")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_programa", nullable = false)
    private Programa programa;

    @Column(name = "fecha_postulacion", nullable = false)
    private LocalDate fechaPostulacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoPostulacion estado;

    // columnDefinition con DEFAULT: evita que Hibernate falle al agregar esta
    // columna contra postulaciones ya existentes (ver el mismo problema en
    // CriterioEvaluacion.activo).
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_aprovechamiento", nullable = false, length = 20,
            columnDefinition = "varchar(20) not null default 'PENDIENTE'")
    private EstadoAprovechamiento estadoAprovechamiento = EstadoAprovechamiento.PENDIENTE;
}