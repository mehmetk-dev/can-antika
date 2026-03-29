package com.mehmetkerem.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mehmetkerem.util.CookieUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Collections;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;

/**
 * Centralized Redis-backed rate limiting filter.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig config;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String RATE_LIMIT_PREFIX = "rate_limit:";
    private static final String JSON_CACHE_ATTRIBUTE = "rateLimit.cachedJsonBody";
    private static final String SUBJECT_HEADER = "X-RateLimit-Subject";
    private static final Set<String> BODY_SCOPED_ENDPOINTS = Set.of("/v1/auth/login", "/v1/contact");

    private static final RedisScript<Long> INCR_WITH_WINDOW_SCRIPT = new DefaultRedisScript<>(
            "local current = redis.call('INCR', KEYS[1]); "
                    + "if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); end; "
                    + "return current;",
            Long.class);

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        // Skip rate limiting for read-only public catalog endpoints (high-traffic, low-risk)
        if (!"GET".equals(request.getMethod())) return false;
        String path = request.getRequestURI();
        return path.startsWith("/v1/product/") || path.startsWith("/v1/category/") || path.startsWith("/v1/period/");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        HttpServletRequest effectiveRequest = shouldCacheRequestBody(path, request)
                ? new CachedBodyHttpServletRequest(request)
                : request;

        String clientIp = resolveClientIp(effectiveRequest);

        for (RateLimitConfig.BucketConfig bucket : config.getBuckets()) {
            if (path.startsWith(bucket.getPathPrefix())) {
                if (!allowRequest(bucket, clientIp, effectiveRequest, path)) {
                    log.warn("Rate limit exceeded: bucket={}, ip={}, path={}", bucket.getName(), clientIp, path);
                    rejectRequest(response, bucket.getMessage());
                    return;
                }
                filterChain.doFilter(effectiveRequest, response);
                return;
            }
        }

        if (!allowGlobal(clientIp)) {
            log.warn("Global rate limit exceeded: ip={}, path={}", clientIp, path);
            rejectRequest(response, "Istek limiti asildi. Lutfen daha sonra tekrar deneyin.");
            return;
        }

        filterChain.doFilter(effectiveRequest, response);
    }

    private boolean allowGlobal(String clientIp) {
        return allowByKey(
                RATE_LIMIT_PREFIX + "global:" + clientIp,
                config.getGlobalMaxRequests(),
                config.getGlobalWindowMinutes());
    }

    private boolean allowRequest(RateLimitConfig.BucketConfig bucket,
            String clientIp,
            HttpServletRequest request,
            String path) {
        String key = buildRateKey(bucket, clientIp, request, path);
        return allowByKey(key, bucket.getMaxRequests(), bucket.getWindowMinutes());
    }

    private boolean allowByKey(String key, int maxRequests, long windowMinutes) {
        Duration windowDuration = Duration.ofMinutes(windowMinutes);

        try {
            Long count = redisTemplate.execute(
                    INCR_WITH_WINDOW_SCRIPT,
                    Collections.singletonList(key),
                    String.valueOf(windowDuration.toMillis()));
            return count == null || count <= maxRequests;
        } catch (Exception e) {
            boolean failOpen = config.isFailOpenOnRedisError();
            log.error("Redis rate limit error. mode={}, error={}", failOpen ? "fail-open" : "fail-closed", e.getMessage());
            return failOpen;
        }
    }

    private String buildRateKey(RateLimitConfig.BucketConfig bucket,
            String clientIp,
            HttpServletRequest request,
            String path) {
        StringBuilder keyBuilder = new StringBuilder(RATE_LIMIT_PREFIX)
                .append(bucket.getName())
                .append(':')
                .append(clientIp);

        if (bucket.isUserScoped()) {
            String subject = resolveSubject(request, path);
            keyBuilder.append(':').append(subject == null ? "anon" : hashSubject(subject));
        }

        return keyBuilder.toString();
    }

    private String resolveSubject(HttpServletRequest request, String path) {
        String headerSubject = normalizeSubject(request.getHeader(SUBJECT_HEADER));
        if (headerSubject != null) {
            return headerSubject;
        }

        if (path.startsWith("/v1/auth/refresh-token")) {
            String token = extractRefreshTokenFromCookie(request);
            if (token != null) {
                return token;
            }
        }

        if (path.startsWith("/v1/auth/login")) {
            String loginSubject = firstNonBlank(
                    extractJsonField(request, "email"),
                    extractJsonField(request, "username"),
                    request.getParameter("email"),
                    request.getParameter("username"));
            if (loginSubject != null) {
                return loginSubject;
            }
        }

        if (path.startsWith("/v1/contact")) {
            String contactSubject = firstNonBlank(
                    extractJsonField(request, "email"),
                    extractJsonField(request, "phone"),
                    request.getParameter("email"),
                    request.getParameter("phone"));
            if (contactSubject != null) {
                return contactSubject;
            }
        }

        if (request.getUserPrincipal() != null) {
            return normalizeSubject(request.getUserPrincipal().getName());
        }

        return null;
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (CookieUtil.REFRESH_TOKEN_COOKIE.equals(cookie.getName())) {
                return normalizeSubject(cookie.getValue());
            }
        }
        return null;
    }

    private String extractJsonField(HttpServletRequest request, String field) {
        JsonNode body = getJsonBody(request);
        if (body == null || !body.isObject()) {
            return null;
        }

        JsonNode value = body.get(field);
        if (value == null || value.isNull()) {
            return null;
        }

        return normalizeSubject(value.asText());
    }

    private JsonNode getJsonBody(HttpServletRequest request) {
        Object cached = request.getAttribute(JSON_CACHE_ATTRIBUTE);
        if (cached instanceof JsonNode jsonNode) {
            return jsonNode;
        }

        if (!(request instanceof CachedBodyHttpServletRequest cachedBodyRequest)) {
            return null;
        }

        byte[] bytes = cachedBodyRequest.getCachedBody();
        if (bytes.length == 0) {
            return null;
        }

        try {
            JsonNode parsed = objectMapper.readTree(bytes);
            request.setAttribute(JSON_CACHE_ATTRIBUTE, parsed);
            return parsed;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalizeSubject(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private String normalizeSubject(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() > 256) {
            return normalized.substring(0, 256);
        }
        return normalized;
    }

    private String hashSubject(String subject) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(subject.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed, 0, 12);
        } catch (Exception ignored) {
            return Integer.toHexString(subject.hashCode());
        }
    }

    private boolean shouldCacheRequestBody(String path, HttpServletRequest request) {
        if (request.getMethod() == null || !"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String contentType = request.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).contains("application/json")) {
            return false;
        }

        return BODY_SCOPED_ENDPOINTS.stream().anyMatch(path::startsWith);
    }

    private void rejectRequest(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = normalizeIp(request.getRemoteAddr());
        if (remoteAddr == null) {
            return "unknown";
        }

        if (isTrustedProxy(remoteAddr)) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                String firstForwarded = normalizeIp(xForwardedFor.split(",")[0]);
                if (firstForwarded != null) {
                    return firstForwarded;
                }
            }

            String xRealIp = normalizeIp(request.getHeader("X-Real-IP"));
            if (xRealIp != null) {
                return xRealIp;
            }
        }

        return remoteAddr;
    }

    private String normalizeIp(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private boolean isTrustedProxy(String remoteAddr) {
        try {
            InetAddress address = InetAddress.getByName(remoteAddr);
            return address.isAnyLocalAddress()
                    || address.isLoopbackAddress()
                    || address.isSiteLocalAddress()
                    || address.isLinkLocalAddress();
        } catch (Exception ignored) {
            return false;
        }
    }

    private static final class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {
        private final byte[] cachedBody;

        private CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
            super(request);
            this.cachedBody = request.getInputStream().readAllBytes();
        }

        byte[] getCachedBody() {
            return cachedBody;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(cachedBody);
            return new ServletInputStream() {
                @Override
                public int read() {
                    return byteArrayInputStream.read();
                }

                @Override
                public boolean isFinished() {
                    return byteArrayInputStream.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener readListener) {
                    // not used
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }
    }
}
