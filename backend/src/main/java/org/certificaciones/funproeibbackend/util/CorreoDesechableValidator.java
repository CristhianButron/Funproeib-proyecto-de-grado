package org.certificaciones.funproeibbackend.util;

import java.util.Set;

/**
 * Detecta correos de proveedores de "buzón temporal" (desechables), usados
 * típicamente para crear varias cuentas evadiendo la verificación por
 * correo. La lista cubre los proveedores públicos más conocidos; no
 * sustituye una verificación de identidad real, solo encarece el abuso más
 * básico (registrarse muchas veces con buzones de un solo uso).
 */
public final class CorreoDesechableValidator {

    private static final Set<String> DOMINIOS_DESECHABLES = Set.of(
            "mailinator.com", "mailinator.net", "mailinator.org",
            "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz",
            "10minutemail.com", "10minutemail.net", "20minutemail.com",
            "tempmail.com", "temp-mail.org", "tempmail.net", "tempmail.io",
            "yopmail.com", "yopmail.net", "yopmail.fr",
            "trashmail.com", "trashmail.net", "trash-mail.com",
            "dispostable.com", "throwawaymail.com", "getnada.com", "fakeinbox.com",
            "sharklasers.com", "grr.la", "spam4.me", "mytemp.email",
            "maildrop.cc", "mintemail.com", "mailnesia.com", "mail-temporaire.fr",
            "moakt.com", "emailondeck.com", "fakemailgenerator.com",
            "discard.email", "discardmail.com", "mohmal.com", "mohmal.im",
            "tempinbox.com", "tempmailo.com", "crazymailing.com", "burnermail.io",
            "inboxkitten.com", "luxusmail.org", "nada.email", "spamgourmet.com",
            "33mail.com", "harakirimail.com", "jetable.org", "mailcatch.com",
            "spambog.com", "spamherelots.com", "anonbox.net", "emailfake.com",
            "correotemporal.org", "correotemporal.com", "temporary-mail.net",
            "mailtemporanea.com", "tempr.email", "deadaddress.com", "incognitomail.com"
    );

    private CorreoDesechableValidator() {
    }

    public static boolean esDesechable(String correo) {
        if (correo == null || !correo.contains("@")) {
            return false;
        }
        String dominio = correo.substring(correo.lastIndexOf('@') + 1).trim().toLowerCase();
        return DOMINIOS_DESECHABLES.contains(dominio);
    }
}
