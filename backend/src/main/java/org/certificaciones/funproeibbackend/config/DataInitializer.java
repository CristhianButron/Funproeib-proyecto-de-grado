package org.certificaciones.funproeibbackend.config;

import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Siembra un usuario administrador por defecto al iniciar la aplicación,
 * para poder ingresar al panel de administración sin tener que crearlo a mano.
 *
 * Credenciales: admin@funproeib.org / admin12345
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!usuarioRepository.existsByCorreo("admin@funproeib.org")) {
            Usuario admin = Usuario.builder()
                    .nombreCompleto("Administrador Funproeib")
                    .correo("admin@funproeib.org")
                    .contrasenaHash(passwordEncoder.encode("admin12345"))
                    .ci("0000000")
                    .rol(RolUsuario.ADMIN)
                    .fechaRegistro(LocalDate.now())
                    .activo(true)
                    .genero(Genero.PREFIERO_NO_INDICAR)
                    .fechaNacimiento(LocalDate.of(1990, 1, 1))
                    .nivelEducativo(NivelEducativo.MAESTRIA)
                    .paisOrigen("Bolivia")
                    .build();
            usuarioRepository.save(admin);
            System.out.println(">>> Usuario ADMIN creado: admin@funproeib.org / admin12345");
        }
    }
}
