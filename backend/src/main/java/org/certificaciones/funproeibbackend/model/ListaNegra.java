package org.certificaciones.funproeibbackend.model;

import org.certificaciones.funproeibbackend.model.enums.MotivoListaNegra;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "lista_negra")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListaNegra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lista_negra")
    private Long id;

    @Column(name = "ci_postulante", nullable = false, length = 20)
    private String ciPostulante;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo", nullable = false, length = 50)
    private MotivoListaNegra motivo;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDate fechaRegistro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario registradoPor;

    @Column(name = "activo")
    @Builder.Default
    private Boolean activo = true;
}