package org.certificaciones.funproeibbackend.config;

import org.certificaciones.funproeibbackend.model.Ciudad;
import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Siembra un usuario administrador por defecto al iniciar la aplicación,
 * para poder ingresar al panel de administración sin tener que crearlo a mano.
 * De paso, siembra un Evaluador y un Postulante de prueba ya verificados,
 * para poder probar esos roles sin tener que registrar a nadie.
 *
 * Credenciales:
 *   admin@funproeib.org      / admin12345       (ADMIN)
 *   evaluador@funproeib.org  / evaluador12345   (EVALUADOR)
 *   postulante@funproeib.org / postulante12345  (POSTULANTE)
 */
@Component
@Order(2)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final CiudadRepository ciudadRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        var ciudadLaPaz = ciudadRepository.findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase("La Paz", "Bolivia").orElse(null);

        sembrarSiNoExiste("admin@funproeib.org", "admin12345", "0000000", "Administrador",
                RolUsuario.ADMIN, NivelEducativo.MAESTRIA, ciudadLaPaz);
        sembrarSiNoExiste("evaluador@funproeib.org", "evaluador12345", "0000001", "Evaluador",
                RolUsuario.EVALUADOR, NivelEducativo.LICENCIATURA, ciudadLaPaz);
        sembrarSiNoExiste("postulante@funproeib.org", "postulante12345", "0000002", "Postulante",
                RolUsuario.POSTULANTE, NivelEducativo.LICENCIATURA, ciudadLaPaz);
    }

    private void sembrarSiNoExiste(String correo, String contrasena, String ci, String nombre,
                                    RolUsuario rol, NivelEducativo nivelEducativo, Ciudad ciudadLaPaz) {
        if (usuarioRepository.existsByCorreo(correo)) {
            return;
        }
        Usuario usuario = Usuario.builder()
                .nombre(nombre)
                .apellidoPaterno("Funproeib")
                .apellidoMaterno("Prueba")
                .correo(correo)
                .contrasenaHash(passwordEncoder.encode(contrasena))
                .ci(ci)
                .rol(rol)
                .fechaRegistro(LocalDate.now())
                .activo(true)
                .emailVerificado(true)
                .debeCambiarPassword(false)
                .genero(Genero.PREFIERO_NO_INDICAR)
                .fechaNacimiento(LocalDate.of(1990, 1, 1))
                .nivelEducativo(nivelEducativo)
                .ciudad(ciudadLaPaz)
                .ciudadNacimiento(ciudadLaPaz)
                .carreras(rol == RolUsuario.POSTULANTE ? List.of("Pedagogía") : List.of())
                .build();
        usuarioRepository.save(usuario);
        System.out.println(">>> Usuario " + rol + " de prueba creado: " + correo + " / " + contrasena);
    }
}
