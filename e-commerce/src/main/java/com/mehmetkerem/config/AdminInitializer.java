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

    private static final String ADMIN_EMAIL = "admin@canantika.com";
    private static final String ADMIN_IMAGE_URL =
            "https://res.cloudinary.com/dqlbenxvc/image/upload/v1777986327/can-antika/2366010e-ba16-41be-ba1c-eafaff11ab6f.png";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.password:#{null}}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        var existingAdmin = userRepository.findByEmail(ADMIN_EMAIL);
        if (existingAdmin.isPresent()) {
            User admin = existingAdmin.get();
            if (!ADMIN_IMAGE_URL.equals(admin.getImageUrl())) {
                admin.setImageUrl(ADMIN_IMAGE_URL);
                userRepository.save(admin);
            }
            return;
        }
        if (adminPassword == null || adminPassword.length() < 12
                || "admin123".equals(adminPassword) || "change-me".equals(adminPassword)) {
            log.warn("APP_ADMIN_PASSWORD ayarlanmamış veya güvenli değil — admin oluşturma atlanıyor. En az 12 karakter belirleyin.");
            return;
        }
        log.info("Varsayılan Admin kullanıcısı oluşturuluyor...");
        User admin = User.builder()
                .email(ADMIN_EMAIL)
                .name("Sistem Yöneticisi")
                .imageUrl(ADMIN_IMAGE_URL)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build();
        userRepository.save(admin);
        log.info("ADMIN OLUŞTURULDU: Email: admin@canantika.com");
    }
}
