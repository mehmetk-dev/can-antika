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
                "Dönemsel estetiği yansıtan antika mobilyalar.",
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85");
        Category aydinlatma = createCategory(
                "Aydınlatma",
                "Mekana karakter katan avize ve aplikler.",
                "https://images.unsplash.com/photo-1519710164239-da123dc03ef4");
        Category saatler = createCategory(
                "Saatler",
                "Mekanik antika saat seçimleri.",
                "https://images.unsplash.com/photo-1509048191080-d2e5e4f57c0f");
        Category aksesuar = createCategory(
                "Aksesuar",
                "Koleksiyonluk obje ve aksesuarlar.",
                "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338");
        Category sanat = createCategory(
                "Sanat ve Tablo",
                "Yağlı boya, gravür ve dekoratif eserler.",
                "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5");

        log.info("10 dummy urun ekleniyor...");
        createProduct("Ceviz Dresuar", "Masif ceviz antika dresuar. 1940'lardan kalma el işçiliği ile üretilmiş, özgün cila dokusu korunmuş nadide bir mobilyadır.", 8750.0, 2, mobilya.getId(),
                "Masif Ceviz", "1940'lar", "Çok İyi", "Orijinal cilası hafifçe yenilenmiş olup, yapısal herhangi bir kusuru veya onarımı bulunmamaktadır.",
                "95 x 120 x 45 cm", "İstanbul, Kadıköy'de eski bir konaktan edinilmiştir. Dönemin Cumhuriyet sonrası Türk ahşap işçiliğini yansıtmaktadır.",
                "Can Antika uzman heyeti tarafından orijinalliği ve dönemsel niteliği incelenmiş ve onaylanmıştır.",
                List.of(
                        "https://images.unsplash.com/photo-1493666438817-866a91353ca9",
                        "https://images.unsplash.com/photo-1484101403633-562f891dc89a",
                        "https://images.unsplash.com/photo-1540518614846-7eded433c457",
                        "https://images.unsplash.com/photo-1538688525198-9b88f6f53126"));

        createProduct("Osmanlı Sandığı", "El oyması kapaklı antika sandık. Ceviz ağacından oyma motiflerle süslü, pirinç kilit mekanizmalı tarihi sandık.", 6200.0, 1, mobilya.getId(),
                "Ceviz ve Pirinç", "1900'ler", "Çok İyi", "Kilit mekanizması orijinaldir ve çalışır durumdadır. Köşe bentlerinde hafif aşınmalar mevcuttur.",
                "60 x 100 x 50 cm", "Edirne yöresine ait eski bir aile mirası sandıktır. Motiflerinde geleneksel Osmanlı lale bezemeleri yer almaktadır.",
                "Can Antika tarafından Geç Osmanlı dönemi üretimi olduğu tescil edilmiştir.",
                List.of(
                        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
                        "https://images.unsplash.com/photo-1595428774223-ef52624120d2",
                        "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92"));

        createProduct("Kristal Avize", "6 kollu kristal avize. Fransız tarzı kesme kristal taşlar ve pirinç gövdeli görkemli aydınlatma armatürü.", 7300.0, 3, aydinlatma.getId(),
                "Kristal ve Pirinç", "1930'lar", "Çalışır", "Elektrik kablo tesisatı güvenlik standartlarına uygun olarak tamamen yenilenmiştir. Eksik kristali bulunmamaktadır.",
                "85 x 65 cm (Yükseklik x Çap)", "Fransa kökenli olup, 1970'li yıllarda Beyoğlu'nda bir apartman dairesinden satın alınmıştır.",
                "Kristallerinin el kesimi olduğu ve 1930'lar Art Deco dönemine ait olduğu doğrulanmıştır.",
                List.of(
                        "https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9",
                        "https://images.unsplash.com/photo-1520699049698-acd2fccb8cc8",
                        "https://images.unsplash.com/photo-1543294001-f7cbfe92237e"));

        createProduct("Pirinç Aplik Çifti", "Duvar için klasik aplik takımı. 2 adet neoklasik tarzda pirinç döküm aplik.", 3400.0, 4, aydinlatma.getId(),
                "Pirinç", "1950'ler", "Çok İyi", "Duy ve kablo kısımları modernize edilmiştir. Pirinç gövdesine koruyucu vernik uygulanmıştır.",
                "30 x 15 x 20 cm", "İtalya üretimi olup, klasik Avrupa duvar aydınlatması tarzına sahiptir.",
                "Orijinal 1950'ler İtalyan döküm işçiliği olduğu onaylanmıştır.",
                List.of("https://images.unsplash.com/photo-1513506003901-1e6a229e2d15"));

        createProduct("Masa Saati", "Kurmalı pirinç masa saati. Alman yapımı kurmalı mekanizmalı, cam fanuslu masa saati.", 4100.0, 2, saatler.getId(),
                "Pirinç ve Cam", "1920'ler", "Çalışır ve Bakımlı", "Mekanik bakımları saat ustamız tarafından yapılmış olup, zamanı hatasız tutmaktadır.",
                "25 x 18 x 12 cm", "Almanya Kara Orman bölgesinden ithal edilmiş klasik kurmalı masa saatidir.",
                "Junghans marka orijinal 1920'ler üretimi mekanizmaya sahiptir.",
                List.of(
                        "https://images.unsplash.com/photo-1508057198894-247b23fe5ade",
                        "https://images.unsplash.com/photo-1524592094714-0f0654e20314",
                        "https://images.unsplash.com/photo-1518970759579-a5bf772b6a61"));

        createProduct("Duvar Saati", "Sarkaçlı antika duvar saati. Ahşap kasalı, saat başı ve yarımda çalan sarkaçlı duvar saati.", 5600.0, 1, saatler.getId(),
                "Maun Ahşap", "1890'lar", "İyi", "Gong ve sarkaç mekanizması eksiksizdir. Ahşap kasasındaki kılcal çatlaklar aslına uygun restore edilmiştir.",
                "80 x 35 x 15 cm", "Avusturya-Macaristan İmparatorluğu dönemine ait, İstanbul levanten ailelerinden birine ait evden edinilmiştir.",
                "Gustav Becker mekanizmalı orijinal 19. yüzyıl sonu duvar saatidir.",
                List.of("https://images.unsplash.com/photo-1464013778555-8e723c2f01f8"));

        createProduct("Telkari Gümüş Bileklik", "El yapımı telkari gümüş bileklik. Cumhuriyet ilk dönemine ait el işçiliği gümüş örgü bileklik.", 2800.0, 5, aksesuar.getId(),
                "925 Ayar Gümüş", "1950'ler", "Çok İyi", "Herhangi bir kırık veya eksik telkari sırası yoktur, kilit tokası sağlamdır.",
                "Genişlik: 2.5 cm, Çevre: 18 cm", "Mardin Midyat yöresine ait geleneksel telkari ustaları tarafından üretilmiştir.",
                "Eserin el yapımı gümüş işçiliği ve dönemi uzmanımızca onaylanmıştır.",
                List.of("https://images.unsplash.com/photo-1611591437281-460bfbe1220a"));

        createProduct("Bronz Kutu", "Kapaklı dekoratif bronz kutu. Üzeri kabartma mitolojik sahnelerle bezeli bronz mücevher kutusu.", 1950.0, 3, aksesuar.getId(),
                "Bronz", "1970'ler", "İyi", "Menteşesi kusursuzdur, iç kadife kaplaması yenilenmiştir.",
                "10 x 15 x 8 cm", "Belçika'daki bir antika pazarından koleksiyonumuza dahil edilmiştir.",
                "Orijinal 1970'ler Avrupa üretimidir.",
                List.of("https://images.unsplash.com/photo-1617038220319-276d3cfab638"));

        createProduct("İstanbul Yağlı Boya", "Kanvas üzerine yağlı boya tablo. İstanbul Boğazı ve tarihi yarımada temalı imzalı tablo.", 9900.0, 1, sanat.getId(),
                "Yağlı Boya Tuval", "1950'ler", "Çok İyi", "Tuval gerginliği korunmuştur, orijinal ahşap varaklı çerçevesiyle birlikte sunulmaktadır.",
                "60 x 80 cm (Çerçevesiz)", "Yerel bir ressam koleksiyonunun dağıtılması ile müzayededen satın alınmıştır.",
                "Ressam imzası ve eserin 1950'ler üretimi olduğu teyit edilmiştir.",
                List.of("https://images.unsplash.com/photo-1578301978018-3005759f48f7"));

        createProduct("Bakır Baskı Gravür", "Çerçeveli bakır baskı gravür tablo. Eski İstanbul haritası ve görünümlerini içeren baskı eser.", 3600.0, 2, sanat.getId(),
                "Kağıt Üzeri Baskı", "1930'lar", "Çok İyi", "Paspartusu asitsiz kartonla yenilenmiş, antireflekte cam kullanılarak çerçevelenmiştir.",
                "45 x 60 cm (Çerçeveli)", "Almanya'da basılmış eski gravür paftalarından biri olup Türkiye'de çerçevelenmiştir.",
                "1930'lar baskısı orijinal gravür levha olduğu doğrulanmıştır.",
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
            String material, String era, String condition, String conditionDetails, String dimensions,
            String provenance, String authenticityNote, List<String> imageUrls) {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("material", material);
        attributes.put("era", era);
        attributes.put("condition", condition);
        attributes.put("conditionDetails", conditionDetails);
        attributes.put("dimensions", dimensions);
        attributes.put("provenance", provenance);
        attributes.put("authenticityNote", authenticityNote);

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
