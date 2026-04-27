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
    private boolean failOpenOnRedisError = true;

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
        private String message = "Istek limiti asildi. Lutfen daha sonra tekrar deneyin.";
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
            authLogin.setMessage("Cok fazla giris denemesi. Lutfen daha sonra tekrar deneyin.");
            buckets.add(authLogin);

            BucketConfig authRefresh = new BucketConfig();
            authRefresh.setName("auth-refresh");
            authRefresh.setPathPrefix("/v1/auth/refresh-token");
            authRefresh.setMaxRequests(20);
            authRefresh.setWindowMinutes(1);
            authRefresh.setUserScoped(true);
            authRefresh.setMessage("Cok fazla token yenileme denemesi. Lutfen daha sonra tekrar deneyin.");
            buckets.add(authRefresh);

            BucketConfig contact = new BucketConfig();
            contact.setName("contact");
            contact.setPathPrefix("/v1/contact");
            contact.setMaxRequests(6);
            contact.setWindowMinutes(1);
            contact.setUserScoped(true);
            contact.setMessage("Cok fazla iletisim denemesi. Lutfen biraz bekleyin.");
            buckets.add(contact);

            BucketConfig payment = new BucketConfig();
            payment.setName("payment");
            payment.setPathPrefix("/v1/payment/");
            payment.setMaxRequests(10);
            payment.setWindowMinutes(1);
            payment.setUserScoped(true);
            payment.setMessage("Odeme istegi limiti asildi. Lutfen kisa sure sonra tekrar deneyin.");
            buckets.add(payment);

            // Public catalog okuma endpoint'leri için cömert limit — scraper koruması
            BucketConfig catalogProduct = new BucketConfig();
            catalogProduct.setName("catalog-product");
            catalogProduct.setPathPrefix("/v1/product");
            catalogProduct.setMaxRequests(120);
            catalogProduct.setWindowMinutes(1);
            catalogProduct.setMessage("Cok fazla urun sorgulamasi. Lutfen biraz bekleyin.");
            buckets.add(catalogProduct);

            BucketConfig catalogCategory = new BucketConfig();
            catalogCategory.setName("catalog-category");
            catalogCategory.setPathPrefix("/v1/category");
            catalogCategory.setMaxRequests(60);
            catalogCategory.setWindowMinutes(1);
            catalogCategory.setMessage("Cok fazla kategori sorgulamasi. Lutfen biraz bekleyin.");
            buckets.add(catalogCategory);

            BucketConfig catalogPeriod = new BucketConfig();
            catalogPeriod.setName("catalog-period");
            catalogPeriod.setPathPrefix("/v1/period");
            catalogPeriod.setMaxRequests(60);
            catalogPeriod.setWindowMinutes(1);
            catalogPeriod.setMessage("Cok fazla donem sorgulamasi. Lutfen biraz bekleyin.");
            buckets.add(catalogPeriod);
        }
    }
}
