package com.mehmetkerem.config;

import com.mehmetkerem.model.Category;
import com.mehmetkerem.model.Product;
import com.mehmetkerem.repository.CartRepository;
import com.mehmetkerem.repository.CategoryRepository;
import com.mehmetkerem.repository.OrderRepository;
import com.mehmetkerem.repository.OrderReturnRepository;
import com.mehmetkerem.repository.ProductRepository;
import com.mehmetkerem.repository.ReviewRepository;
import com.mehmetkerem.repository.SupportTicketRepository;
import com.mehmetkerem.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.seed.dev-data.enabled", havingValue = "true")
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DevDataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderReturnRepository orderReturnRepository;
    private final ReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;
    private final CartRepository cartRepository;
    private final SupportTicketRepository supportTicketRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Dev seed basliyor: mevcut kategori ve urun verileri temizlenecek.");
        try {
            supportTicketRepository.deleteAll();
            orderReturnRepository.deleteAll();
            orderRepository.deleteAll();
            reviewRepository.deleteAll();
            wishlistRepository.deleteAll();
            cartRepository.deleteAll();
            productRepository.deleteAll();
            categoryRepository.deleteAll();
        } catch (Exception e) {
            log.error("Temizlik sirasinda hata: {}", e.getMessage());
        }

        log.info("5 kategori olusturuluyor...");
        Category mobilya = createCategory(
                "Mobilya",
                "Donemsel estetigi yansitan antika mobilyalar.",
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85");
        Category aydinlatma = createCategory(
                "Aydinlatma",
                "Mekana karakter katan avize ve aplikler.",
                "https://images.unsplash.com/photo-1519710164239-da123dc03ef4");
        Category saatler = createCategory(
                "Saatler",
                "Mekanik antika saat secimleri.",
                "https://images.unsplash.com/photo-1509048191080-d2e5e4f57c0f");
        Category aksesuar = createCategory(
                "Aksesuar",
                "Koleksiyonluk obje ve aksesuarlar.",
                "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338");
        Category sanat = createCategory(
                "Sanat ve Tablo",
                "Yagli boya, gravur ve dekoratif eserler.",
                "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5");

        log.info("10 dummy urun ekleniyor...");
        createProduct("Ceviz Dresuar", "Masif ceviz antika dresuar.", 8750.0, 2, mobilya.getId(),
                "Ceviz", "1940lar", "Iyi",
                List.of(
                        "https://images.unsplash.com/photo-1493666438817-866a91353ca9",
                        "https://images.unsplash.com/photo-1484101403633-562f891dc89a"));
        createProduct("Osmanli Sandik", "El oyma kapakli antika sandik.", 6200.0, 1, mobilya.getId(),
                "Ahsap", "1900ler", "Cok Iyi",
                List.of("https://images.unsplash.com/photo-1555041469-a586c61ea9bc"));

        createProduct("Kristal Avize", "6 kollu kristal avize.", 7300.0, 3, aydinlatma.getId(),
                "Kristal", "1930lar", "Calisir",
                List.of("https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9"));
        createProduct("Pirinc Aplik Cifti", "Duvar icin klasik aplik takimi.", 3400.0, 4, aydinlatma.getId(),
                "Pirinc", "1950ler", "Iyi",
                List.of("https://images.unsplash.com/photo-1513506003901-1e6a229e2d15"));

        createProduct("Masa Saati", "Kurmali pirinc masa saati.", 4100.0, 2, saatler.getId(),
                "Pirinc", "1920ler", "Bakimli",
                List.of("https://images.unsplash.com/photo-1508057198894-247b23fe5ade"));
        createProduct("Duvar Saati", "Sarkacli antika duvar saati.", 5600.0, 1, saatler.getId(),
                "Maun", "1890ler", "Iyi",
                List.of("https://images.unsplash.com/photo-1464013778555-8e723c2f01f8"));

        createProduct("Telkari Gumus Bileklik", "El yapimi telkari bileklik.", 2800.0, 5, aksesuar.getId(),
                "Gumus", "Yeni", "Sifir",
                List.of("https://images.unsplash.com/photo-1611591437281-460bfbe1220a"));
        createProduct("Bronz Kutu", "Kapakli dekoratif bronz kutu.", 1950.0, 3, aksesuar.getId(),
                "Bronz", "1970ler", "Iyi",
                List.of("https://images.unsplash.com/photo-1617038220319-276d3cfab638"));

        createProduct("Istanbul Yagli Boya", "Kanvas uzerine yagli boya.", 9900.0, 1, sanat.getId(),
                "Tuval", "1950ler", "Cok Iyi",
                List.of("https://images.unsplash.com/photo-1578301978018-3005759f48f7"));
        createProduct("Bakir Baski Gravur", "Cerceveli bakir baski gravur.", 3600.0, 2, sanat.getId(),
                "Kagit", "1930ler", "Iyi",
                List.of("https://images.unsplash.com/photo-1577083552431-6e5fd01aa342"));

        log.info("5 kategori ve 10 urun basariyla olusturuldu.");
    }

    private Category createCategory(String name, String description, String coverImageUrl) {
        Category category = Category.builder()
                .name(name)
                .description(description)
                .coverImageUrl(coverImageUrl)
                .build();
        return categoryRepository.save(category);
    }

    private void createProduct(String title, String description, double price, int stock, Long categoryId,
            String material, String era, String condition, List<String> imageUrls) {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("material", material);
        attributes.put("era", era);
        attributes.put("condition", condition);

        Product product = Product.builder()
                .title(title)
                .description(description)
                .price(BigDecimal.valueOf(price))
                .stock(stock)
                .categoryId(categoryId)
                .imageUrls(imageUrls)
                .attributes(attributes)
                .build();
        productRepository.save(product);
    }
}
