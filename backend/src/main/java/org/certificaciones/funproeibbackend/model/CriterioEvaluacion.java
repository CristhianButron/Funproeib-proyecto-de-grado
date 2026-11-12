package org.certificaciones.funproeibbackend.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Catálogo de criterios de evaluación de postulaciones, basado en el
 * documento "Criterios de evaluación de postulaciones" de Funproeib Andes.
 * No depende de un programa específico: se usa igual en todos. Cada criterio
 * activo se califica de 1 a 10, y el puntaje total de la evaluación se
 * normaliza siempre sobre 100 según cuántos criterios estén activos al
 * momento de evaluar (ver EvaluacionServiceImpl.calcularPuntajeTotal), por lo
 * que agregar o desactivar un criterio no exige cambiar esta escala.
 * Un criterio no se elimina físicamente: se desactiva (activo=false) para no
 * romper el historial de evaluaciones que ya lo calificaron.
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

    // columnDefinition con DEFAULT: sin esto, Hibernate genera "add column
    // activo boolean not null" al actualizar el esquema, lo que falla contra
    // una tabla con filas ya existentes (como los 6 criterios sembrados antes
    // de este campo) porque Postgres no tiene con qué completar las filas
    // viejas. Con el default, esas filas quedan en activo=true automáticamente.
    @Builder.Default
    @Column(name = "activo", nullable = false, columnDefinition = "boolean not null default true")
    private Boolean activo = true;
}
