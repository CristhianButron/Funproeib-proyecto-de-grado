package org.certificaciones.funproeibbackend.config;

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
 *
 * Credenciales: admin@funproeib.org / admin12345
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
        if (!usuarioRepository.existsByCorreo("admin@funproeib.org")) {
            var ciudadLaPaz = ciudadRepository.findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase("La Paz", "Bolivia").orElse(null);
            Usuario admin = Usuario.builder()
                    .nombre("Administrador")
                    .apellidoPaterno("Funproeib")
                    .correo("admin@funproeib.org")
                    .contrasenaHash(passwordEncoder.encode("admin12345"))
                    .ci("0000000")
                    .rol(RolUsuario.ADMIN)
                    .fechaRegistro(LocalDate.now())
                    .activo(true)
                    .emailVerificado(true)
                    .identidadVerificada(true) // cuenta sembrada por el sistema, no por autoregistro: no necesita carnet
                    .debeCambiarPassword(false)
                    .genero(Genero.PREFIERO_NO_INDICAR)
                    .fechaNacimiento(LocalDate.of(1990, 1, 1))
                    .nivelEducativo(NivelEducativo.MAESTRIA)
                    .ciudad(ciudadLaPaz)
                    .ciudadNacimiento(ciudadLaPaz)
                    .build();
            usuarioRepository.save(admin);
            System.out.println(">>> Usuario ADMIN creado: admin@funproeib.org / admin12345");
        }

        // Backfill para bases de datos que ya tenían usuarios ADMIN/EVALUADOR
        // antes de agregar la verificación de identidad: esas cuentas de staff
        // no se autoregistraron con carnet, así que no tiene sentido pedirles
        // esa verificación -de lo contrario quedarían bloqueadas para siempre
        // en el login (ver UsuarioServiceImpl.login).
        var staffSinVerificar = usuarioRepository.findByRolIn(List.of(RolUsuario.ADMIN, RolUsuario.EVALUADOR))
                .stream().filter(u -> !Boolean.TRUE.equals(u.getIdentidadVerificada())).toList();
        staffSinVerificar.forEach(u -> u.setIdentidadVerificada(true));
        usuarioRepository.saveAll(staffSinVerificar);
    }
}
