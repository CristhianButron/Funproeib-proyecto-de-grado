package org.certificaciones.funproeibbackend.config;

import org.certificaciones.funproeibbackend.model.Usuario;
import org.certificaciones.funproeibbackend.model.enums.Genero;
import org.certificaciones.funproeibbackend.model.enums.NivelEducativo;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.certificaciones.funproeibbackend.repository.CiudadRepository;
import org.certificaciones.funproeibbackend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Siembra cuentas de prueba por defecto al iniciar la aplicación, para poder
 * entrar al sistema con cada rol sin tener que crearlas a mano (ni pasar por
 * el registro + verificación de identidad, en el caso del postulante).
 *
 * Credenciales:
 *   admin@funproeib.org      / admin12345       (ADMIN)
 *   evaluador@funproeib.org  / evaluador12345   (EVALUADOR)
 *   postulante@funproeib.org / postulante12345  (POSTULANTE)
 *
 * Gateado a "local"/"integration" a propósito: son contraseñas conocidas y
 * publicadas acá mismo, así que nunca deben sembrarse en un entorno real
 * (producción). Para que esta protección sirva, el despliegue en producción
 * tiene que fijar SPRING_PROFILES_ACTIVE a un valor distinto de "local"
 * (por ejemplo "prod"); si no se fija nada, el default sigue siendo "local"
 * (ver application.properties) y esto se seguiría sembrando.
 */
@Component
@Order(2)
@Profile({"local", "integration"})
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

        if (!usuarioRepository.existsByCorreo("evaluador@funproeib.org")) {
            var ciudadLaPaz = ciudadRepository.findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase("La Paz", "Bolivia").orElse(null);
            Usuario evaluador = Usuario.builder()
                    .nombre("Evaluador").apellidoPaterno("De Prueba")
                    .correo("evaluador@funproeib.org")
                    .contrasenaHash(passwordEncoder.encode("evaluador12345"))
                    .ci("0000001")
                    .rol(RolUsuario.EVALUADOR)
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
            usuarioRepository.save(evaluador);
            System.out.println(">>> Usuario EVALUADOR creado: evaluador@funproeib.org / evaluador12345");
        }

        if (!usuarioRepository.existsByCorreo("postulante@funproeib.org")) {
            var ciudadLaPaz = ciudadRepository.findFirstByNombreIgnoreCaseAndPaisNombreIgnoreCase("La Paz", "Bolivia").orElse(null);
            Usuario postulante = Usuario.builder()
                    .nombre("Postulante").apellidoPaterno("De Prueba")
                    .correo("postulante@funproeib.org")
                    .contrasenaHash(passwordEncoder.encode("postulante12345"))
                    .ci("0000002")
                    .rol(RolUsuario.POSTULANTE)
                    .fechaRegistro(LocalDate.now())
                    .activo(true)
                    .emailVerificado(true)
                    // No se autoregistró con carnet (no tiene rutaCarnetAnverso/Reverso),
                    // pero igual se marca verificada a propósito: es una cuenta de
                    // prueba sembrada por el sistema para poder postular de una, no
                    // una cuenta real esperando revisión del Administrador.
                    .identidadVerificada(true)
                    .debeCambiarPassword(false)
                    .genero(Genero.PREFIERO_NO_INDICAR)
                    .fechaNacimiento(LocalDate.of(1998, 6, 15))
                    .nivelEducativo(NivelEducativo.LICENCIATURA)
                    .carreras(List.of("Ciencias de la Educación"))
                    .ciudad(ciudadLaPaz)
                    .ciudadNacimiento(ciudadLaPaz)
                    .build();
            usuarioRepository.save(postulante);
            System.out.println(">>> Usuario POSTULANTE creado: postulante@funproeib.org / postulante12345");
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
