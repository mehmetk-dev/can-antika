package com.mehmetkerem.config;

import com.mehmetkerem.enums.Role;
import com.mehmetkerem.model.User;
import com.mehmetkerem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("!test")
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.password:#{null}}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail("admin@canantika.com")) {
            return;
        }
        if (adminPassword == null || adminPassword.length() < 12
                || "admin123".equals(adminPassword) || "change-me".equals(adminPassword)) {
            log.warn("APP_ADMIN_PASSWORD ayarlanmamış veya güvenli değil — admin oluşturma atlanıyor. En az 12 karakter belirleyin.");
            return;
        }
        log.info("Varsayılan Admin kullanıcısı oluşturuluyor...");
        User admin = User.builder()
                .email("admin@canantika.com")
                .name("Sistem Yöneticisi")
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build();
        userRepository.save(admin);
        log.info("ADMIN OLUŞTURULDU: Email: admin@canantika.com");
    }
}
