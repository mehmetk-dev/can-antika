package com.mehmetkerem.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Merkezi rate limit konfigürasyonu.
 * Tüm limitler application.properties üzerinden yönetilir.
 */
@Data
@Component
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitConfig {

    /** Herhangi bir bucket'a uymayan tüm istekler için global limit (IP başına). */
    private int globalMaxRequests = 60;
    private long globalWindowMinutes = 1;

    /** Redis erişilemezse fail-open/fail-closed davranışı. */
    private boolean failOpenOnRedisError = false;

    /** Endpoint bazlı özel limitler. Sıra önemli, ilk eşleşen bucket uygulanır. */
    private List<BucketConfig> buckets = new ArrayList<>();

    @Data
    public static class BucketConfig {
        private String name;
        private String pathPrefix;
        private int maxRequests;
        private long windowMinutes = 1;
        /** true ise key: ip + subject (email/refresh/principal) olarak üretilir. */
        private boolean userScoped = false;
        private String message = "İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.";
    }

    @PostConstruct
    public void initDefaults() {
        if (buckets.isEmpty()) {
            BucketConfig authLogin = new BucketConfig();
            authLogin.setName("auth-login");
            authLogin.setPathPrefix("/v1/auth/login");
            authLogin.setMaxRequests(5);
            authLogin.setWindowMinutes(1);
            authLogin.setUserScoped(true);
            authLogin.setMessage("Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.");
            buckets.add(authLogin);

            BucketConfig authRefresh = new BucketConfig();
            authRefresh.setName("auth-refresh");
            authRefresh.setPathPrefix("/v1/auth/refresh-token");
            authRefresh.setMaxRequests(20);
            authRefresh.setWindowMinutes(1);
            authRefresh.setUserScoped(true);
            authRefresh.setMessage("Çok fazla token yenileme denemesi. Lütfen daha sonra tekrar deneyin.");
            buckets.add(authRefresh);

            BucketConfig authForgotPassword = new BucketConfig();
            authForgotPassword.setName("auth-forgot-password");
            authForgotPassword.setPathPrefix("/v1/auth/forgot-password");
            authForgotPassword.setMaxRequests(3);
            authForgotPassword.setWindowMinutes(1);
            authForgotPassword.setUserScoped(true);
            authForgotPassword.setMessage("Çok fazla şifre sıfırlama isteği. Lütfen biraz bekleyin.");
            buckets.add(authForgotPassword);

            BucketConfig authResetPassword = new BucketConfig();
            authResetPassword.setName("auth-reset-password");
            authResetPassword.setPathPrefix("/v1/auth/reset-password");
            authResetPassword.setMaxRequests(5);
            authResetPassword.setWindowMinutes(1);
            authResetPassword.setMessage("Çok fazla şifre sıfırlama denemesi. Lütfen biraz bekleyin.");
            buckets.add(authResetPassword);

            BucketConfig contact = new BucketConfig();
            contact.setName("contact");
            contact.setPathPrefix("/v1/contact");
            contact.setMaxRequests(6);
            contact.setWindowMinutes(1);
            contact.setUserScoped(true);
            contact.setMessage("Çok fazla iletişim denemesi. Lütfen biraz bekleyin.");
            buckets.add(contact);

            BucketConfig payment = new BucketConfig();
            payment.setName("payment");
            payment.setPathPrefix("/v1/payment/");
            payment.setMaxRequests(10);
            payment.setWindowMinutes(1);
            payment.setUserScoped(true);
            payment.setMessage("Ödeme isteği limiti aşıldı. Lütfen kısa süre sonra tekrar deneyin.");
            buckets.add(payment);

            // Public catalog okuma endpoint'leri için cömert limit — scraper koruması
            BucketConfig catalogProduct = new BucketConfig();
            catalogProduct.setName("catalog-product");
            catalogProduct.setPathPrefix("/v1/product");
            catalogProduct.setMaxRequests(120);
            catalogProduct.setWindowMinutes(1);
            catalogProduct.setMessage("Çok fazla ürün sorgulaması. Lütfen biraz bekleyin.");
            buckets.add(catalogProduct);

            BucketConfig catalogCategory = new BucketConfig();
            catalogCategory.setName("catalog-category");
            catalogCategory.setPathPrefix("/v1/category");
            catalogCategory.setMaxRequests(60);
            catalogCategory.setWindowMinutes(1);
            catalogCategory.setMessage("Çok fazla kategori sorgulaması. Lütfen biraz bekleyin.");
            buckets.add(catalogCategory);

            BucketConfig catalogPeriod = new BucketConfig();
            catalogPeriod.setName("catalog-period");
            catalogPeriod.setPathPrefix("/v1/period");
            catalogPeriod.setMaxRequests(60);
            catalogPeriod.setWindowMinutes(1);
            catalogPeriod.setMessage("Çok fazla dönem sorgulaması. Lütfen biraz bekleyin.");
            buckets.add(catalogPeriod);
            return;
        }

        ensureSecurityBucket("auth-forgot-password", "/v1/auth/forgot-password", 3, true,
                "Çok fazla şifre sıfırlama isteği. Lütfen biraz bekleyin.");
        ensureSecurityBucket("auth-reset-password", "/v1/auth/reset-password", 5, false,
                "Çok fazla şifre sıfırlama denemesi. Lütfen biraz bekleyin.");
    }

    private void ensureSecurityBucket(String name, String path, int maxRequests, boolean userScoped, String message) {
        boolean exists = buckets.stream().anyMatch(bucket -> name.equals(bucket.getName()));
        if (exists) {
            return;
        }

        BucketConfig bucket = new BucketConfig();
        bucket.setName(name);
        bucket.setPathPrefix(path);
        bucket.setMaxRequests(maxRequests);
        bucket.setWindowMinutes(1);
        bucket.setUserScoped(userScoped);
        bucket.setMessage(message);

        int catchAllIndex = -1;
        for (int i = 0; i < buckets.size(); i++) {
            if ("/v1/".equals(buckets.get(i).getPathPrefix())) {
                catchAllIndex = i;
                break;
            }
        }
        if (catchAllIndex >= 0) {
            buckets.add(catchAllIndex, bucket);
        } else {
            buckets.add(bucket);
        }
    }
}
