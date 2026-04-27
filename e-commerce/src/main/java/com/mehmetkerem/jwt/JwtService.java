package com.mehmetkerem.jwt;

import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Arrays;
import java.util.Date;

@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final Environment environment;

    @Value("${jwt.secret}")      private String secret;
    @Value("${jwt.expirationMs:86400000}") private long expirationMs;

    private static final String PLACEHOLDER_PREFIX = "change-this-to";

    @PostConstruct
    void validateSecret() {
        boolean isProd = environment != null
                && Arrays.stream(environment.getActiveProfiles())
                        .anyMatch(p -> p.equalsIgnoreCase("prod") || p.equalsIgnoreCase("production"));
        if (secret == null || secret.isBlank() || secret.startsWith(PLACEHOLDER_PREFIX)) {
            if (isProd) {
                throw new IllegalStateException(
                        "JWT secret güvenli değil! Üretim ortamında JWT_SECRET ortam değişkenini ayarlayın.");
            }
            log.warn("⚠️  JWT secret placeholder kullanılıyor — üretim ortamında JWT_SECRET env ile değiştirin!");
        }
    }

    private Key key() {
        // secret en az 256-bit olmalı (Base64 de kullanabilirsin)
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UserDetails user) {
        var roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).toList();

        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("roles", roles)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return parser().parseClaimsJws(token).getBody().getSubject();
    }

    public boolean isValid(String token, UserDetails user) {
        var claims = parser().parseClaimsJws(token).getBody();
        return user.getUsername().equals(claims.getSubject()) && claims.getExpiration().after(new Date());
    }

    private JwtParser parser() {
        return Jwts.parserBuilder().setSigningKey(key()).build();
    }
}

