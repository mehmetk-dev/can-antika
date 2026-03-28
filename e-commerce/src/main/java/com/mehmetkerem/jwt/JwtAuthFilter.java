package com.mehmetkerem.jwt;

import com.mehmetkerem.util.CookieUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        // 1) Authorization header'dan token al
        String token = extractFromHeader(req);

        // 2) Header'da yoksa cookie'den oku (AUDIT M1)
        if (token == null) {
            token = extractFromCookie(req);
        }

        if (token == null) {
            chain.doFilter(req, res);
            return;
        }

        String username;
        try {
            username = jwtService.extractUsername(token);
        } catch (Exception e) {
            chain.doFilter(req, res);
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                var user = userDetailsService.loadUserByUsername(username);
                if (jwtService.isValid(token, user)) {
                    var authToken = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (UsernameNotFoundException ex) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(req, res);
    }

    private String extractFromHeader(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7).trim();
            return token.isEmpty() ? null : token;
        }
        return null;
    }

    private String extractFromCookie(HttpServletRequest req) {
        if (req.getCookies() == null) return null;
        for (Cookie cookie : req.getCookies()) {
            if (CookieUtil.ACCESS_TOKEN_COOKIE.equals(cookie.getName())) {
                String token = cookie.getValue();
                if (token == null) return null;
                token = token.trim();
                return token.isEmpty() ? null : token;
            }
        }
        return null;
    }
}
