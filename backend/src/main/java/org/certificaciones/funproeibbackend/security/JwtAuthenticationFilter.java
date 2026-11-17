package org.certificaciones.funproeibbackend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lee el header "Authorization: Bearer <token>" de cada petición. Si el
 * token es válido, deja al usuario autenticado para el resto del filtro de
 * seguridad (con su id como "name" y "ROLE_<rol>" como autoridad). Si no
 * viene token, o es inválido, simplemente sigue sin autenticar — es
 * SecurityConfig quien decide después si esa ruta necesitaba estarlo.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            jwtService.validar(token).ifPresent(datos -> {
                var authority = new SimpleGrantedAuthority("ROLE_" + datos.rol().name());
                var auth = new UsernamePasswordAuthenticationToken(
                        String.valueOf(datos.idUsuario()), null, List.of(authority));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }

        filterChain.doFilter(request, response);
    }
}
