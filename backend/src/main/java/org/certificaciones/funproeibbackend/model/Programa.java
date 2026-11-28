package org.certificaciones.funproeibbackend.model;

import org.certificaciones.funproeibbackend.model.enums.EstadoPrograma;
import org.certificaciones.funproeibbackend.model.enums.TipoPrograma;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "programa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Programa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_programa")
    private Long id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoPrograma tipo;

    @Column(name = "edicion", length = 10)
    private String edicion;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(name = "cupos_disponibles", nullable = false)
    private Integer cuposDisponibles;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoPrograma estado;

    // Contenido público de la convocatoria (pantalla de detalle para
    // postulantes y visitantes anónimos), separado de los requisitos de
    // documentos (ReqDocumento) que son para la carga de archivos.
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "programa_modulo", joinColumns = @JoinColumn(name = "id_programa"))
    @Column(name = "modulo", length = 255)
    @OrderColumn(name = "orden")
    @Builder.Default
    private List<String> modulos = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "programa_requisito_general", joinColumns = @JoinColumn(name = "id_programa"))
    @Column(name = "requisito", length = 255)
    @OrderColumn(name = "orden")
    @Builder.Default
    private List<String> requisitosGenerales = new ArrayList<>();
}