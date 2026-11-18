package org.certificaciones.funproeibbackend.model;

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

    // String y no el enum EstadoAprovechamiento: con @Enumerated (o incluso
    // con @Convert), Hibernate agrega un CHECK constraint derivado del
    // conjunto de valores del enum que NO se actualiza solo si luego se
    // agrega un valor nuevo (como ABANDONO) en una base de datos que ya
    // tiene esta columna, y rechaza el valor nuevo con un error. Guardando un
    // String plano evitamos ese constraint; la conversión a/desde
    // EstadoAprovechamiento se hace en el service.
    // columnDefinition con DEFAULT: evita que Hibernate falle al agregar esta
    // columna contra postulaciones ya existentes (ver el mismo problema en
    // CriterioEvaluacion.activo).
    @Builder.Default
    @Column(name = "estado_aprovechamiento", nullable = false, length = 20,
            columnDefinition = "varchar(20) not null default 'PENDIENTE'")
    private String estadoAprovechamiento = "PENDIENTE";
}