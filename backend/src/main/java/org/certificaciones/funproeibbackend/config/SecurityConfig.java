package org.certificaciones.funproeibbackend.config;

import org.certificaciones.funproeibbackend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Autenticación por JWT (ver JwtAuthenticationFilter) y autorización por rol
 * a nivel de ruta. El detalle de qué rol puede hacer qué está comentado
 * junto a cada bloque porque no es obvio de otra forma: varias rutas que
 * "suenan" de administrador en realidad también las usa el rol EVALUADOR
 * (ver evaluaciones.ts en el frontend), y al revés.
 *
 * Que un usuario solo pueda ver/editar SUS PROPIOS recursos (su perfil, sus
 * postulaciones, y sus documentos/respuestas que cuelgan de ellas) está
 * resuelto con @PreAuthorize directamente en cada controlador, no acá: en
 * UsuarioController/PostulacionController comparando el id de la ruta contra
 * authentication.name, y en DocumentoController/RespuestaController contra
 * el dueño real de la postulación (ver RecursoAuthService/@recursoAuth,
 * porque ahí el id de la ruta es el del documento o la postulación, no el
 * del usuario). Evaluaciones queda fuera a propósito: son del dominio de
 * ADMIN/EVALUADOR, el postulante nunca accede a ellas directamente.
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // Lista separada por comas de orígenes permitidos. Por defecto trae los
    // dos puertos que se usan en desarrollo local (4200 es el normal de
    // "ng serve"; 4300 es el alterno cuando Windows bloquea el 4200). En
    // producción hay que definir APP_CORS_ORIGENES con el/los dominio(s)
    // reales del frontend desplegado -por ejemplo "https://funproeib.org"-,
    // porque "localhost" nunca va a coincidir con el origen real del navegador.
    @Value("${app.cors.origenes}")
    private String corsOrigenes;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // Público: sin esto nadie podría ni registrarse ni entrar, ni
                        // recuperar su contraseña si la olvida sin tener sesión.
                        .requestMatchers(HttpMethod.POST, "/api/usuarios/registro", "/api/usuarios/login",
                                "/api/usuarios/reenviar-verificacion", "/api/usuarios/olvide-password",
                                "/api/usuarios/restablecer-password").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/verificar-correo").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ubicaciones/**").permitAll()

                        // Público: el landing y la pantalla de "convocatoria completa" los
                        // muestran a cualquier visitante, no solo a usuarios logueados. Los
                        // requisitos de documentos también, porque ahí es donde se muestran
                        // los "requisitos" de la convocatoria.
                        .requestMatchers(HttpMethod.GET, "/api/programas", "/api/programas/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/req-documentos/programa/*").permitAll()

                        // Solo administrador: gestión de usuarios, catálogos y reportes.
                        .requestMatchers(HttpMethod.GET, "/api/usuarios", "/api/usuarios/pendientes-identidad").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/usuarios/*/rol", "/api/usuarios/*/activo",
                                "/api/usuarios/*/identidad/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/*/carnet/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/usuarios/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/programas", "/api/preguntas", "/api/req-documentos")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/programas/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/preguntas/**").hasRole("ADMIN")
                        .requestMatchers("/api/lista-negra/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/criterios").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/criterios").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/criterios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/criterios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/documentos/*/verificar",
                                "/api/documentos/postulacion/*/verificar-todos").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/postulaciones/estado/**").hasRole("ADMIN")

                        // Administrador o evaluador: revisión/evaluación de postulaciones,
                        // registrar el estado final (aprovechamiento) de los beneficiarios, y
                        // consultar reportes (el evaluador también tiene esa pantalla, ver
                        // app.routes.ts del frontend: ruta /evaluador/reportes).
                        .requestMatchers(HttpMethod.PATCH, "/api/postulaciones/*/estado").hasAnyRole("ADMIN", "EVALUADOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/postulaciones/*/aprovechamiento").hasAnyRole("ADMIN", "EVALUADOR")
                        .requestMatchers(HttpMethod.GET, "/api/postulaciones/programa/**").hasAnyRole("ADMIN", "EVALUADOR")
                        .requestMatchers("/api/evaluaciones/**").hasAnyRole("ADMIN", "EVALUADOR")
                        .requestMatchers(HttpMethod.GET, "/api/criterios/activos").hasAnyRole("ADMIN", "EVALUADOR")
                        .requestMatchers("/api/reportes/**").hasAnyRole("ADMIN", "EVALUADOR")

                        // Cualquier usuario logueado: su propio uso del portal (postular,
                        // subir documentos, responder preguntas). El dueño exacto del
                        // recurso se valida con @PreAuthorize donde importa de verdad
                        // (ver UsuarioController y PostulacionController).
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(corsOrigenes.split(","))
                .map(String::strip)
                .filter(origen -> !origen.isBlank())
                .toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
