package org.certificaciones.funproeibbackend.model;

import org.certificaciones.funproeibbackend.model.enums.EstadoCivil;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    @Column(name = "nombre", nullable = false, length = 80)
    private String nombre;

    @Column(name = "apellido_paterno", nullable = false, length = 80)
    private String apellidoPaterno;

    @Column(name = "apellido_materno", length = 80)
    private String apellidoMaterno;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ciudad")
    private Ciudad ciudad;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_civil", length = 20)
    private EstadoCivil estadoCivil;

    @Column(name = "provincia_nacimiento", length = 100)
    private String provinciaNacimiento;

    @Column(name = "direccion_domicilio", length = 255)
    private String direccionDomicilio;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "usuario_carrera", joinColumns = @JoinColumn(name = "id_usuario"))
    @Column(name = "carrera", length = 150)
    @Builder.Default
    private List<String> carreras = new ArrayList<>();

    /**
     * Nombre completo derivado (no persistido) para mostrar en listados y
     * reportes sin duplicar el dato en la base.
     */
    public String getNombreCompleto() {
        StringBuilder sb = new StringBuilder();
        if (nombre != null && !nombre.isBlank()) sb.append(nombre);
        if (apellidoPaterno != null && !apellidoPaterno.isBlank()) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(apellidoPaterno);
        }
        if (apellidoMaterno != null && !apellidoMaterno.isBlank()) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(apellidoMaterno);
        }
        return sb.toString();
    }
}
