package com.mehmetkerem.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * JWT token'ları HttpOnly + Secure + SameSite=Strict cookie olarak yönetir. (AUDIT M1)
 */
@Component
public class CookieUtil {

    public static final String ACCESS_TOKEN_COOKIE = "can_antika_token";
    public static final String REFRESH_TOKEN_COOKIE = "can_antika_refresh";

    @Value("${jwt.expirationMs:1800000}")
    private int accessTokenExpiry;

    @Value("${jwt.refreshExpirationMs:86400000}")
    private int refreshTokenExpiry;

    @Value("${app.cookie.secure:true}")
    private boolean secure;

    @Value("${app.cookie.same-site:Strict}")
    private String sameSite;

    public void addAccessTokenCookie(HttpServletResponse response, String token) {
        addCookie(response, ACCESS_TOKEN_COOKIE, token, accessTokenExpiry / 1000);
    }

    public void addRefreshTokenCookie(HttpServletResponse response, String token) {
        addCookie(response, REFRESH_TOKEN_COOKIE, token, refreshTokenExpiry / 1000);
    }

    public void clearTokenCookies(HttpServletResponse response) {
        addCookie(response, ACCESS_TOKEN_COOKIE, "", 0);
        addCookie(response, REFRESH_TOKEN_COOKIE, "", 0);
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        cookie.setAttribute("SameSite", resolveSameSite());
        response.addCookie(cookie);
    }

    private String resolveSameSite() {
        if (sameSite == null) {
            return "Strict";
        }

        String normalized = sameSite.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "lax" -> "Lax";
            case "none" -> "None";
            default -> "Strict";
        };
    }
}
