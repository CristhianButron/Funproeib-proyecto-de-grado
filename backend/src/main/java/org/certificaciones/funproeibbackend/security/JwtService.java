package org.certificaciones.funproeibbackend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.certificaciones.funproeibbackend.model.enums.RolUsuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

/**
 * Genera y valida los JWT que identifican la sesión de un usuario ante la
 * API. El token lleva el id y el rol del usuario en sus claims; no hace
 * falta volver a consultar la base en cada petición para saber quién es
 * ni qué puede hacer (el rol puede quedar desactualizado hasta que el
 * token expire si un admin se lo cambia a alguien con sesión activa, algo
 * aceptable dada la duración corta del token).
 */
@Service
public class JwtService {

    private final SecretKey clave;
    private final long expiracionMinutos;

    public JwtService(
            @Value("${app.jwt.secret}") String secreto,
            @Value("${app.jwt.expiracion-minutos:480}") long expiracionMinutos) {
        this.clave = Keys.hmacShaKeyFor(secreto.getBytes(StandardCharsets.UTF_8));
        this.expiracionMinutos = expiracionMinutos;
    }

    public String generarToken(Long idUsuario, RolUsuario rol) {
        Date ahora = new Date();
        Date expira = new Date(ahora.getTime() + expiracionMinutos * 60_000);
        return Jwts.builder()
                .subject(String.valueOf(idUsuario))
                .claim("rol", rol.name())
                .issuedAt(ahora)
                .expiration(expira)
                .signWith(clave)
                .compact();
    }

    /** Devuelve los datos del token si es válido y no expiró; vacío si no. */
    public Optional<DatosToken> validar(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(clave).build()
                    .parseSignedClaims(token).getPayload();
            Long idUsuario = Long.valueOf(claims.getSubject());
            RolUsuario rol = RolUsuario.valueOf(claims.get("rol", String.class));
            return Optional.of(new DatosToken(idUsuario, rol));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public record DatosToken(Long idUsuario, RolUsuario rol) {
    }
}
