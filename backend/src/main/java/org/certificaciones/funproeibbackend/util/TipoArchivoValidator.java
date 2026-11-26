package org.certificaciones.funproeibbackend.util;

import java.util.Map;
import java.util.function.Predicate;

/**
 * Valida el contenido real de un archivo subido comparando sus primeros
 * bytes ("firma" o "magic bytes") contra lo que su extensión dice ser, para
 * que no baste con renombrar un archivo (por ejemplo, un video .mp4 a
 * foto.jpg) para pasar el filtro de extensión de DocumentoServiceImpl o
 * UsuarioServiceImpl.
 *
 * No es una detección exhaustiva de tipo MIME (no reemplazaría a una
 * librería como Apache Tika para un sistema con más superficie de archivos),
 * pero cubre el caso concreto que importa acá: el puñado de formatos que el
 * sistema acepta (PDF, DOC, DOCX, PNG, JPG).
 */
public final class TipoArchivoValidator {

    private static final Map<String, Predicate<byte[]>> FIRMAS = Map.of(
            "pdf", cabecera -> empiezaCon(cabecera, 0x25, 0x50, 0x44, 0x46), // %PDF
            "png", cabecera -> empiezaCon(cabecera, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A),
            "jpg", cabecera -> empiezaCon(cabecera, 0xFF, 0xD8, 0xFF),
            "jpeg", cabecera -> empiezaCon(cabecera, 0xFF, 0xD8, 0xFF),
            "doc", cabecera -> empiezaCon(cabecera, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1), // OLE2
            // .docx es un .zip (formato OOXML): comprobar la firma de ZIP es
            // suficiente para descartar un archivo que no es ni remotamente
            // un .docx real, sin tener que abrir el zip y mirar su contenido.
            "docx", cabecera -> empiezaCon(cabecera, 0x50, 0x4B, 0x03, 0x04)
    );

    private TipoArchivoValidator() {
    }

    /**
     * @param cabecera primeros bytes del archivo (alcanza con los primeros
     *                 ~8); si viene más corto de lo que la firma necesita, no
     *                 coincide.
     * @param extension extensión declarada (ya en minúsculas, sin el punto)
     * @return true si la extensión no tiene firma conocida (no se valida) o
     *         si el contenido coincide con la firma esperada para esa extensión
     */
    public static boolean contenidoCoincideConExtension(byte[] cabecera, String extension) {
        Predicate<byte[]> firma = FIRMAS.get(extension);
        if (firma == null || cabecera == null) {
            return true;
        }
        return firma.test(cabecera);
    }

    private static boolean empiezaCon(byte[] cabecera, int... esperados) {
        if (cabecera.length < esperados.length) {
            return false;
        }
        for (int i = 0; i < esperados.length; i++) {
            if ((cabecera[i] & 0xFF) != esperados[i]) {
                return false;
            }
        }
        return true;
    }
}
