package com.mehmetkerem.config;

import com.mehmetkerem.model.Product;
import com.mehmetkerem.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Component
@Profile("!test")
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class ProductSlugInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<Product> products = productRepository.findAll();
        int updated = 0;

        for (Product product : products) {
            boolean needsUpdate = false;

            if (product.getSlug() == null || product.getSlug().isBlank()) {
                product.setSlug(generateSlug(product.getTitle()) + "-" + product.getId());
                needsUpdate = true;
            } else if (product.getId() != null && !product.getSlug().endsWith("-" + product.getId())) {
                // Mevcut slug'a ID suffix ekle (benzersizlik için)
                product.setSlug(product.getSlug() + "-" + product.getId());
                needsUpdate = true;
            }

            if (needsUpdate) {
                productRepository.save(product);
                updated++;
            }
        }

        if (updated > 0) {
            log.info("Slug düzeltmesi: {} ürün güncellendi.", updated);
        }
    }

    private String generateSlug(String text) {
        if (text == null) return "urun";
        return text.toLowerCase(Locale.forLanguageTag("tr"))
                .replace("ı", "i").replace("ğ", "g").replace("ü", "u")
                .replace("ş", "s").replace("ö", "o").replace("ç", "c")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
