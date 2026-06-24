package org.certificaciones.funproeibbackend.model;

import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long id;

    @Column(name = "nombre_completo", nullable = false, length = 150)
    private String nombreCompleto;

    @Column(name = "correo", nullable = false, unique = true, length = 100)
    private String correo;

    @Column(name = "contrasena_hash", nullable = false, length = 255)
    private String contrasenaHash;

    @Column(name = "ci", nullable = false, unique = true, length = 20)
    private String ci;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false, length = 20)
    private RolUsuario rol;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDate fechaRegistro;

    @Column(name = "activo")
    @Builder.Default
    private Boolean activo = true;

    // --- Campos de perfil del postulante ---

    @Enumerated(EnumType.STRING)
    @Column(name = "genero", length = 25)
    private Genero genero;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "autoidentificacion_etnica", length = 100)
    private String autoidentificacionEtnica;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_educativo", length = 30)
    private NivelEducativo nivelEducativo;

    @Column(name = "pais_origen", length = 100)
    private String paisOrigen;

    @Column(name = "departamento_origen", length = 100)
    private String departamentoOrigen;

    @Column(name = "municipio_origen", length = 100)
    private String municipioOrigen;

    @Column(name = "telefono", length = 20)
    private String telefono;
}
