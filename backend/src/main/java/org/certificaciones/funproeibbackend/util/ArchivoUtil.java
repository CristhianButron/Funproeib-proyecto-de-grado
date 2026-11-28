package org.certificaciones.funproeibbackend.util;

import org.certificaciones.funproeibbackend.dto.ArchivoDescargable;
import org.certificaciones.funproeibbackend.exception.ResourceNotFoundException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Resolución compartida de archivos subidos (carnets, documentos de
 * postulación): extensión del nombre y lectura segura desde uploadsDir
 * (usada por DocumentoServiceImpl y UsuarioServiceImpl).
 */
public final class ArchivoUtil {

    private ArchivoUtil() {
    }

    public static String obtenerExtension(String nombreArchivo) {
        int punto = nombreArchivo.lastIndexOf('.');
        return punto >= 0 && punto < nombreArchivo.length() - 1
                ? nombreArchivo.substring(punto + 1).toLowerCase()
                : "";
    }

    /**
     * Resuelve rutaRelativa dentro de uploadsDir evitando salir del
     * directorio (path traversal) y construye el ArchivoDescargable.
     */
    public static ArchivoDescargable resolverDescargable(String uploadsDir, String rutaRelativa, String nombreArchivo,
                                                           String mensajeNoDisponible, String mensajeErrorLectura) {
        try {
            Path raiz = Paths.get(uploadsDir).toAbsolutePath().normalize();
            Path destino = raiz.resolve(rutaRelativa).normalize();
            if (!destino.startsWith(raiz) || !Files.exists(destino)) {
                throw new ResourceNotFoundException(mensajeNoDisponible);
            }

            String contentType = Files.probeContentType(destino);
            Resource recurso = new UrlResource(destino.toUri());

            return ArchivoDescargable.builder()
                    .recurso(recurso)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .nombreArchivo(nombreArchivo)
                    .build();
        } catch (IOException e) {
            throw new UncheckedIOException(mensajeErrorLectura, e);
        }
    }
}
