package org.certificaciones.funproeibbackend.config;

import org.certificaciones.funproeibbackend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
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

import java.util.List;

/**
 * Autenticación por JWT (ver JwtAuthenticationFilter) y autorización por rol
 * a nivel de ruta. El detalle de qué rol puede hacer qué está comentado
 * junto a cada bloque porque no es obvio de otra forma: varias rutas que
 * "suenan" de administrador en realidad también las usa el rol EVALUADOR
 * (ver evaluaciones.ts en el frontend), y al revés.
 *
 * Lo que esta configuración NO cubre: que un usuario solo pueda ver/editar
 * SUS PROPIOS recursos anidados (sus documentos, sus respuestas). Eso se
 * resolvió para los casos más sensibles con @PreAuthorize directamente en
 * UsuarioController y PostulacionController (ver esas clases); para
 * documentos/respuestas/evaluaciones no se implementó -cualquier usuario
 * autenticado puede leer/escribir por id si lo adivina- y queda señalado
 * como una limitación conocida, no un descuido.
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // Público: sin esto nadie podría ni registrarse ni entrar.
                        .requestMatchers(HttpMethod.POST, "/api/usuarios/registro", "/api/usuarios/login",
                                "/api/usuarios/reenviar-verificacion").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/verificar-correo").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ubicaciones/**").permitAll()

                        // Solo administrador: gestión de usuarios, catálogos y reportes.
                        .requestMatchers(HttpMethod.GET, "/api/usuarios").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/usuarios/*/rol", "/api/usuarios/*/activo").hasRole("ADMIN")
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
                        .requestMatchers(HttpMethod.PATCH, "/api/postulaciones/*/aprovechamiento").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/postulaciones/estado/**").hasRole("ADMIN")
                        .requestMatchers("/api/reportes/**").hasRole("ADMIN")

                        // Administrador o evaluador: revisión y evaluación de postulaciones.
                        .requestMatchers(HttpMethod.PATCH, "/api/postulaciones/*/estado").hasAnyRole("ADMIN", "EVALUADOR")
                        .requestMatchers(HttpMethod.GET, "/api/postulaciones/programa/**").hasAnyRole("ADMIN", "EVALUADOR")
                        .requestMatchers("/api/evaluaciones/**").hasAnyRole("ADMIN", "EVALUADOR")
                        .requestMatchers(HttpMethod.GET, "/api/criterios/activos").hasAnyRole("ADMIN", "EVALUADOR")

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
        // 4200 es el puerto normal de "ng serve"; 4300 queda habilitado también
        // porque en Windows el 4200 a veces lo bloquea el sistema (EACCES) y
        // hay que levantar el frontend en otro puerto mientras se resuelve eso.
        config.setAllowedOrigins(List.of("http://localhost:4200", "http://localhost:4300"));
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
