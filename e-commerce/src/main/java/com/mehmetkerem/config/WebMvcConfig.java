package com.mehmetkerem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC konfigürasyonu.
 * CORS ayarları SecurityConfig üzerinden yönetilir (AUDIT M4).
 * Bu sınıf artık yalnızca gerektiğinde ek WebMvc yapılandırmaları için kullanılır.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    // CORS tanımı kaldırıldı — SecurityConfig.corsConfigurationSource() tek yetkili kaynak.
}
