package com.mehmetkerem.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Merkezi rate limiting filtresi — Redis tabanlı. (AUDIT M8)
 * <p>
 * İstek geldiğinde sırasıyla bucket'ları kontrol eder.
 * İlk eşleşen bucket'ın limiti uygulanır.
 * Hiçbir bucket eşleşmezse global limit uygulanır.
 * <p>
 * Tüm ayarlar {@link RateLimitConfig} üzerinden application.properties'ten yönetilir.
 * Multi-instance deployment'ta da tutarlı çalışır.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig config;
    private final StringRedisTemplate redisTemplate;

    private static final String RATE_LIMIT_PREFIX = "rate_limit:";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = resolveClientIp(request);

        // 1) Bucket eşleştirme — ilk eşleşen uygulanır
        for (RateLimitConfig.BucketConfig bucket : config.getBuckets()) {
            if (path.startsWith(bucket.getPathPrefix())) {
                if (!allowRequest(bucket.getName(), clientIp, bucket.getMaxRequests(), bucket.getWindowMinutes())) {
                    log.warn("Rate limit aşıldı: bucket={}, ip={}", bucket.getName(), clientIp);
                    rejectRequest(response, bucket.getMessage());
                    return;
                }
                filterChain.doFilter(request, response);
                return;
            }
        }

        // 2) Hiçbir bucket eşleşmedi → global limit
        if (!allowRequest("global", clientIp, config.getGlobalMaxRequests(), config.getGlobalWindowMinutes())) {
            log.warn("Global rate limit aşıldı: ip={}", clientIp);
            rejectRequest(response, "İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean allowRequest(String bucketName, String clientIp, int maxRequests, long windowMinutes) {
        String key = RATE_LIMIT_PREFIX + bucketName + ":" + clientIp;
        Duration windowDuration = Duration.ofMinutes(windowMinutes);

        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, windowDuration);
            }
            return count == null || count <= maxRequests;
        } catch (Exception e) {
            log.error("Redis rate limit hatası, istek izin veriliyor: {}", e.getMessage());
            return true; // Redis erişilemezse isteği engelleme
        }
    }

    private void rejectRequest(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isBlank()) {
            return xForwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
