# Mimari Analiz Raporu — Can Antika Backend (Spring Boot)

## KRİTİK SEVİYE (Yoğun sorumluluk yığılması)

---

### 1. `service/impl/OrderServiceImpl.java` — 512 satır

**Yığılan sorumluluklar:**
- Sipariş oluşturma iş akışı: sepet doğrulama → CartItem→OrderItem dönüşümü → stok kontrol & düşürme → kupon uygulama → adres doğrulama → sipariş kaydetme → timeline kaydı → sepet temizleme → event yayınlama
- Stok yönetimi: `validateAndDeductStock()`, `revertStockLevels()` — ürün stok düşürme/iade mantığı burada yaşıyor
- Optimistic locking retry mekanizması (3 deneme döngüsü)
- Sipariş sorgulama (5 farklı sorgu metodu + Specification ile arama)
- Sipariş durum güncelleme + timeline kaydı + event yayınlama
- Kargo takip güncelleme + otomatik durum değişikliği (PENDING/PAID → SHIPPED)
- Sipariş iptali + yetkilendirme kontrolü
- Fatura çıktısı oluşturma (`getOrderInvoice`)
- Timeline/status history sorgulama + yetkilendirme (owner/admin kontrolü)
- DTO dönüşümleri: `convertOrderToOrderResponse()`, `convertCartItemsToOrderItems()`, `convertToResponseOrderItems()`

**Toplam bağımlılık sayısı:** 9 servis/repo (OrderRepository, OrderStatusHistoryRepository, ICartService, IProductService, IAddressService, ICouponService, IUserService, AddressMapper, IActivityLogService + ApplicationEventPublisher + TransactionTemplate)

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Stok kontrol & düşürme/iade mantığı | `StockService` → `validateAndDeductStock()`, `revertStockLevels()` |
| Sipariş oluşturma orkestrasyon | `OrderCreationService` → `doSaveOrder()` + retry mekanizması |
| Sipariş sorgulama | Mevcut `OrderServiceImpl` sadeleştirilmiş haliyle kalabilir |
| Fatura oluşturma | `OrderInvoiceService` veya mevcut `IInvoicePdfService` genişletilir |
| Timeline (status history) | `OrderTimelineService` → `getOrderTimeline()`, timeline kayıt mantığı |
| DTO dönüşümleri | `OrderMapper`'a taşınmalı (mevcut mapper kullanılmıyor!) |

---

### 2. `service/impl/CartServiceImpl.java` — 327 satır

**Yığılan sorumluluklar:**
- Sepet CRUD: kaydetme, öğe ekleme, miktar güncelleme, öğe silme, temizleme
- Stok doğrulama: 2 ayrı overloaded `validateStock()` metodu — biri `List<CartItemRequest>` için (47 satır), biri `Product` için
- Kupon uygulama/kaldırma iş mantığı (`applyCoupon`, `removeCoupon`, `calculateTotal`)
- Cart yoksa otomatik oluşturma (lazy initialization)
- CartItem → CartItemResponse dönüşümde ürün bilgisi zenginleştirme (N sorgu potansiyeli)
- Merge logic: aynı ürünlü kalemler birleştirilmesi

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Stok doğrulama mantığı | `StockValidationService` → `validateCartStock()` (OrderServiceImpl ile paylaşılabilir) |
| Kupon uygulaması | Mevcut `ICouponService` yeterli, cart'taki kupon mantığı `CartCouponService`'e taşınabilir |
| CartItem → CartItemResponse ile ürün zenginleştirme | `CartItemResponseMapper` → batch product fetch + mapping |
| Merge logic (aynı ürün birleştirme) | `CartItemMerger` utility sınıfı |

---

### 3. `aspect/ActivityLoggingAspect.java` — 265 satır

**Yığılan sorumluluklar:**
- Auth, Cart, Order, Payment, Return, Review, Wishlist, Address, Ticket olmak üzere **9 farklı domain** için AOP loglama
- Her domain'in kendine ait pointcut + handler metodu var (17 ayrı `@AfterReturning` metot)
- Tüm domain'lerin aktivite loglama kuralları tek dosyada

**Sorun:** Yeni bir domain/entity eklendiğinde bu dosya sürekli büyüyecek. Tek sınıf tüm domain'ler için çapraz kesişim (cross-cutting) sorumluluğunu taşıyor.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Auth loglama | `AuthLoggingAspect` |
| Order/Payment loglama | `OrderLoggingAspect` |
| Cart/Wishlist loglama | `ShoppingLoggingAspect` |
| Review/Ticket loglama | `FeedbackLoggingAspect` |
| Alternatif yaklaşım | `@LogActivity` custom annotation → tek bir generic aspect ile otomatik loglama |

---

### 4. `controller/impl/RestSiteSettingsController.java` — 209 satır

**Yığılan sorumluluklar:**
- Controller içinde **DTO dönüşüm mantığı**: `toResponse()` (30 satır), `toPublicResponse()` (30 satır), `applyRequest()` (50+ satır)
- **3 farklı mapping metodu** controller'da tanımlanmış — bunlar mapper katmanında olmalı
- `toPublicResponse()` ile `toResponse()` arasındaki fark sadece hassas alanların filtrelenmesi — bu iş bir `SiteSettingsMapper` içinde olmalı
- `applyRequest()` — 50+ satır if-null kontrolüyle field-by-field partial update — bu pattern service veya mapper katmanında yaşamalı
- `maskSecret()` — gizli alan maskeleme utility'si controller'da tanımlı

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| `toResponse()` + `toPublicResponse()` | `SiteSettingsMapper` sınıfı → `toAdminResponse()`, `toPublicResponse()` |
| `applyRequest()` partial update | `SiteSettingsMapper.applyPartialUpdate(entity, request)` |
| `maskSecret()` | `util/SecretMasker.java` veya mapper içinde utility metot |
| Controller | Sadece endpoint tanımları + service çağrıları kalmalı |

---

### 5. `controller/impl/RestOrderControllerImpl.java` — 191 satır

**Yığılan sorumluluklar:**
- Controller içinde **yetkilendirme mantığı** tekrarı: `cancelOrder()`, `getOrderInvoice()`, `downloadInvoicePdf()` metotlarında aynı owner/admin kontrolü 3 kez yazılmış
- `cancelOrder()` içinde sipariş durum kontrolü (PENDING veya PAID) — bu iş mantığı service katmanında olmalı, controller'da tekrarlanmamalı
- `downloadInvoicePdf()` içinde tam yetkilendirme + PDF response oluşturma
- `requireCurrentUserId()` static helper controller'da tanımlı

**Sorun:** `cancelOrder()` metodu service'deki `OrderServiceImpl.cancelOrder()` ile çakışıyor ve **farklı kurallar uyguluyor** — service sadece PENDING izin veriyor, controller PENDING + PAID izin veriyor. Bu tutarsızlık kritik bir bug kaynağı.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Owner/admin yetkilendirme kontrolü | `OrderAuthorizationService.assertCanAccessOrder(orderId, userId)` veya `@PreAuthorize` SpEL ifadesi |
| İptal iş kuralı | Tek yerde: `OrderServiceImpl.cancelOrder()` — controller sadece çağırsın |
| PDF download response oluşturma | Yetkilendirme ayrıldıktan sonra controller sadeleşir |

---

### 6. `service/impl/ReportServiceImpl.java` — 211 satır

**Yığılan sorumluluklar:**
- 5 farklı rapor türü tek sınıfta: `salesByCategory()`, `stockReport()`, `customerReport()`, `revenueReport()`, `abandonedCarts()`
- Her rapor metodu kendi içinde başka domain'lere erişiyor: OrderRepository, ProductRepository, UserRepository, CartRepository, CategoryRepository — **5 repository**
- `abandonedCarts()` metodu tek başına 45 satır — cart → user → product lookup + N+1 riski
- `stockReport()` tüm ürünleri çekip Java'da filtreliyor — SQL WHERE ile veritabanında filtrelenmeli
- `salesByCategory()` tüm kategorileri + ürünleri çekip Java'da join yapıyor — native query ile SQL'de yapılmalı

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Satış raporu | `SalesCategoryReportService` |
| Stok raporu | `StockReportService` + SQL-level filtering (`productRepository.findByStockLessThan()`) |
| Müşteri raporu | `CustomerReportService` |
| Gelir raporu | `RevenueReportService` |
| Terkedilmiş sepet raporu | `AbandonedCartReportService` + batch product/user fetch |
| VEYA | `ReportServiceImpl` kalır ama her rapor metodu ayrı strategy/delegate'e yönlendirilir |

---

### 7. `config/DataInitializer.java` — 183 satır

**Yığılan sorumluluklar:**
- Admin kullanıcı oluşturma + şifre güvenlik validasyonu
- 6 kategori oluşturma
- 20 ürün oluşturma (her biri için hardcoded veri — yaklaşık 100 satır)
- Mevcut verilerin silinmesi (7 farklı repository'den `deleteAll()`)
- Seed data'nın idempotent olup olmadığını kontrol eden sayım mantığı

**Sorun:** Seed data mantığı ile admin oluşturma mantığı birbirine karışmış. Admin oluşturma prod'da da geçerli olabilir ama seed data sadece dev profile'a özel.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Admin oluşturma | `AdminInitializer` — `@Profile("!test")` veya her environment'ta çalışabilir |
| Seed data | `DevDataSeeder` — `@Profile("dev")` |
| Ürün/kategori seed | Harici JSON/YAML dosyasından yükleme (hardcoded string yerine) |

---

## ORTA SEVİYE

---

### 8. `service/impl/AuthService.java` — 177 satır

**Yığılan sorumluluklar:**
- Kayıt (register) + Giriş (login) + Token yenileme (refreshToken)
- Şifre sıfırlama akışı: `forgotPassword()` + `resetPassword()`
- Şifre değiştirme: `changePassword()`
- Profil güncelleme: `updateProfile()` — isim değişikliği
- Oturum bilgisi: `getMe()`
- Çıkış: `logout()`

**Sorun:** Profil güncelleme (`updateProfile`) bir auth işlemi değil, user işlemi. `getMe()` de esasen bir user sorgusu. Bu metotlar `IUserService`'de olmalı.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| `updateProfile()` | `UserServiceImpl.updateProfile()` |
| `getMe()` | `UserServiceImpl.getUserResponseById()` zaten aynı işi yapıyor, controller doğrudan çağırabilir |
| Şifre sıfırlama akışı | `PasswordResetService` → `forgotPassword()`, `resetPassword()`, `changePassword()` |
| Login + Register + Token Refresh | `AuthService` olarak kalır (temel sorumluluk) |

---

### 9. `service/impl/ProductServiceImpl.java` — 234 satır

**Yığılan sorumluluklar:**
- Ürün CRUD: kaydetme, güncelleme, silme
- Silme sırasında dosya temizliği: Cloudinary'den resim silme
- Rating güncelleme: `updateProductRating()` — bu ReviewService tarafından tetikleniyor
- Arama: Specification tabanlı filtreleme + pagination
- Slug oluşturma: Model'de (`Product`) ama slug oluşturma mantığı 13 satır inline
- Cache yönetimi: `@Cacheable` + `@CacheEvict` annotation'ları
- Batch category fetch: `mapProductsWithCategories()` → N+1 çözümü olarak iyi ama 20 satır

**Sorun:** Temelde kabul edilebilir boyutta ama resim silme + rating güncelleme gibi yan sorumluluklar servis dışına taşınabilir.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Resim silme (Cloudinary cleanup) | `ProductImageService` veya event-driven (ProductDeletedEvent → cleanup) |
| Rating güncelleme | `ProductRatingService` veya mevcut ReviewService'ten event ile |
| Slug oluşturma | `util/SlugUtils.java` — birden fazla entity'de kullanılabilir (BlogPost da slug kullanıyor) |

---

### 10. `service/impl/InvoicePdfServiceImpl.java` — 227 satır

**Yığılan sorumluluklar:**
- Fatura PDF oluşturma orchestration (header, customer info, items table, totals, footer)
- PDF render detayları: cell styling, font tanımları, color constants, stripe pattern
- İş mantığı: KDV hesaplama (`VAT_RATE = 0.18`)
- Fiyat formatlama: `formatPrice()`
- Firma bilgileri hardcoded footer'da ("Çukurcuma Caddesi No: 45...")

**Sorun:** Tüm PDF layout + rendering detayları tek sınıfta. Footer'daki firma bilgileri `SiteSettings`'ten okunmalı.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Font/Color/Style constants | `InvoiceStyleConfig` veya `PdfStyleConstants` |
| Firma bilgileri | `SiteSettings`'ten dinamik okuma |
| KDV hesaplama | `TaxCalculationService` (gelecekte farklı oranlar gerekebilir) |
| Fiyat formatlama | `util/PriceFormatter.java` (frontend'de de kullanılıyordu) |

---

### 11. `util/EmailTemplates.java` — 165 satır

**Yığılan sorumluluklar:**
- 6 farklı e-posta şablonu: `orderConfirmation`, `welcome`, `passwordReset`, `orderTracking`, `stockAlert`, `orderStatusUpdate`
- Tüm HTML markup inline string olarak Java sınıfında tanımlı
- Ortak wrap fonksiyonu: header + footer + body template
- Firma bilgileri ("Çukurcuma Caddesi...", "info@canantika.com") hardcoded

**Sorun:** HTML şablonları Java kodunda yaşıyor. Tasarım değişikliği için yeniden derleme gerekiyor. Firma bilgileri `SiteSettings`'ten gelmeli.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| HTML şablonları | Thymeleaf/FreeMarker template dosyaları (`resources/templates/email/`) |
| Firma bilgileri | `SiteSettings`'ten dinamik injection |
| `EmailTemplates.java` | `EmailTemplateService` → template engine + SiteSettings entegrasyonu |

---

### 12. `controller/impl/RestBlogControllerImpl.java` — 158 satır

**Yığılan sorumluluklar:**
- Controller içinde **DTO dönüşüm mantığı**: `toCatResponse()`, `toCatEntity()`, `toPostResponse()`, `toPostEntity()` — 4 mapping metodu
- Hem public hem admin endpoint'leri tek controller'da (farklı path prefix: `/v1/blog` vs `/v1/admin/blog`)

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| DTO mapping metotları | `BlogMapper` sınıfı (`mapper/BlogMapper.java`) |
| Admin endpoint'leri | `RestAdminBlogController` olarak ayrılabilir (opsiyonel) |

---

### 13. `service/impl/StatsServiceImpl.java` — 161 satır

**Yığılan sorumluluklar:**
- 5 farklı istatistik hesabı: dailyStats, topProducts, topCustomers, orderStatusBreakdown, monthlyTrends
- `OrderEventListener.resolveStatusLabel()` — başka bir sınıfa bağımlılık sadece Türkçe label almak için
- Her build metodu ayrı try-catch ile sarılmış — hata yutma paterni

**Sorun:** Hata yutma (`catch → emptyList`) sorunları gizliyor. Status label dönüşümü `OrderEventListener`'da tanımlı ama buradan erişiliyor — kötü bağımlılık yönü.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Status label çözümleme | `OrderStatusUtils.resolveLabel(status)` — ortak utility |
| Hata yönetimi | Logla ama boş liste döndürme stratejisini dokümante et veya fallback belirle |
| İstatistik hesaplama | Boyut olarak kabul edilebilir, ancak `OrderAnalyticsService` olarak yeniden adlandırılması daha doğru olurdu |

---

### 14. `config/SecurityConfig.java` — 140 satır

**Sorun:** Kabul edilebilir boyutta ama tüm endpoint izin kuralları (20+ `.requestMatchers()`) tek bir metotta tanımlı. Yeni endpoint eklendikçe büyüyecek.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| URL pattern'leri | `SecurityConstants` sınıfında `String[]` dizileri olarak gruplandırılabilir |
| CORS configuration | `CorsConfig` olarak ayrılabilir (opsiyonel) |

---

### 15. `service/impl/PaymentServiceImpl.java` — 153 satır

**Yığılan sorumluluklar:**
- Ödeme işleme: validasyonlar (5 farklı kontrol) + strateji çağrısı + sipariş durumu güncelleme
- Ödeme CRUD: getById, getByUser, updateStatus, delete
- DTO dönüşümü: `convertPaymentToResponse()` — user ve order bilgisi ekleme

**Sorun:** `processPayment()` içinde `orderService.updateOrderStatus()` ve `orderService.updatePaymentStatus()` çağrıları var — ödeme servisi sipariş durumunu güncelliyor. Bu **circular dependency riski** ve domain sınırı ihlali.

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Sipariş durumu güncelleme | Ödeme sonrası event yayınla → `OrderService` event listener'ı güncelleme yapsın (SRP) |
| DTO dönüşümü | `PaymentMapper`'a taşınmalı |
| Validasyonlar | `PaymentValidator` — overloaded validation method'lar |

---

## DÜŞÜK SEVİYE (ama düzeltilmeli)

| Dosya | Satır | Sorun | Öneri |
|-------|-------|-------|-------|
| `controller/impl/RestFileUploadControllerImpl.java` | 130 | Dosya validasyonu (magic byte kontrolü, extension kontrolü, content type kontrolü) controller'da ~40 satır | `FileValidationService` veya `ImageValidator` utility'sine taşı |
| `controller/impl/RestActivityLogController.java` | 101 | Kabul edilebilir | — |
| `service/impl/ReviewServiceImpl.java` | 153 | `getReviewsByProductId()` içinde user bilgileri teker teker çekiliyor (cache'li ama N sorgu) | `UserService.getUsersByIds(List<Long>)` batch metodu ekle |
| `service/impl/SupportTicketServiceImpl.java` | 141 | İnline `TicketReplyEvent` record tanımlı (dosya sonunda) | `event/TicketReplyEvent.java` olarak ayrılmalı |
| `service/impl/CouponServiceImpl.java` | 166 | 2 farklı `createCoupon()` overload — biri primitive parametreli, biri request DTO'lu | Primitive parametreli olanı kaldır, sadece DTO versiyonunu tut |
| `service/impl/AddressServiceImpl.java` | 111 | Temiz, SRP uyumlu | — |
| `model/SiteSettings.java` | 162 | **God Entity**: 50+ alan — mağaza, firma, iletişim, teslimat, sosyal medya, SEO, SMTP, ödeme, SMS, para birimi, bakım modu | Embedded sınıflara ayır: `@Embedded StoreConfig`, `SmtpConfig`, `PaymentConfig`, `SeoConfig` vb. |
| `model/User.java` | 123 | `UserDetails` implementasyonu doğrudan entity'de — entity hem domain modeli hem Spring Security contract'ı taşıyor | Kabul edilebilir (yaygın pattern), ama ileride `CustomUserDetails` wrapper ile ayrılabilir |
| `config/RateLimitFilter.java` | 100 | Temiz, iyi yapılandırılmış | — |
| `handler/GlobalExceptionHandler.java` | 80 | Temiz, kapsamlı | — |

---

## YATAY SORUNLAR (Cross-cutting)

### 1. Yetkilendirme Tekrarı (Authorization Duplication)
`RestOrderControllerImpl`, `OrderServiceImpl`, `PaymentServiceImpl` içinde "Bu sipariş size ait değil" / "Yetkiniz yok" kontrolleri **en az 6 yerde** tekrarlanıyor. Her yerde farklı mesajlar ve farklı kontrol mantığı var.

**Çözüm:** `OrderAuthorizationService` veya Spring Security `@PreAuthorize` SpEL expression:
```java
@PreAuthorize("@orderSecurity.isOwnerOrAdmin(#orderId)")
```

### 2. DTO Dönüşümlerinin Yanlış Katmanda Olması
`RestSiteSettingsController` (60+ satır mapping), `RestBlogControllerImpl` (4 mapping metot), `OrderServiceImpl` (3 convert metot), `PaymentServiceImpl`, `StatsServiceImpl` — DTO dönüşümleri controller veya service katmanında inline yazılmış.

**Çözüm:** Tüm mapping'ler `mapper/` paketindeki MapStruct veya manual mapper sınıflarına taşınmalı. Projede zaten `mapper/` paketi var ama sadece 11 mapper tanımlı, eksikler: **SiteSettingsMapper, BlogMapper, PaymentMapper(mevcut ama kullanılmıyor tam), StatsMapper, ActivityLogMapper**.

### 3. Status Label Tekrarı
`OrderEventListener.resolveStatusLabel()` static metodu hem `StatsServiceImpl` hem event listener tarafından kullanılıyor. İleride controller'larda da gerekebilir.

**Çözüm:** `util/OrderStatusUtils.java` → `getLabel(OrderStatus)` — tüm status label mantığı tek yerde.

### 4. Firma Bilgileri Hardcoded
`EmailTemplates.java` ("Çukurcuma Caddesi No: 45, Beyoğlu, İstanbul", "info@canantika.com"), `InvoicePdfServiceImpl.java` ("CAN ANTIKA", aynı adres) ve `SiteSettings` entity'si default değerler — üç farklı yerde aynı bilgiler tekrarlanıyor.

**Çözüm:** Tek kaynak: `SiteSettings` entity'si. Email template ve PDF servisleri `SiteSettings`'i inject ederek dinamik okuma yapmalı.

### 5. N+1 Sorgu Riski
- `ReportServiceImpl.abandonedCarts()` — her cart item için ayrı product sorgusu
- `ReportServiceImpl.stockReport()` — tüm ürünler çekilip Java'da filtreleniyor + her ürün için kategori sorgusu
- `ReviewServiceImpl.getDetails()` — her review için user + product sorgusu (tekil çağrılarda)

**Çözüm:** Batch fetch pattern'i tutarlı uygulanmalı. `getReviewsByProductId()` zaten batch yapıyor ama `getDetails()` tekil çağrılarda N+1'e yol açıyor. `ReportServiceImpl` SQL-level join/filter'a geçmeli.

### 6. `OrderServiceImpl` ↔ `PaymentServiceImpl` Circular Dependency Riski
`PaymentServiceImpl` → `IOrderService` (sipariş durumu güncelleme)
`OrderServiceImpl` → herhangi bir ödeme bağımlılığı şu anda yok ama bağımlılık yönü tehlikeli.

**Çözüm:** Ödeme sonrası durumu event-driven güncellemek: `PaymentProcessedEvent` → `OrderEventListener` sipariş durumunu günceller.

### 7. Mapper/Conversion Tutarsızlığı
Proje'de 11 mapper sınıfı var (`mapper/` paketi) ama birçoğu **kullanılmıyor veya eksik**:
- `OrderMapper` var ama `OrderServiceImpl` kendi `convertOrderToOrderResponse()` metodunu kullanıyor
- `PaymentMapper` var ama `PaymentServiceImpl` kendi convert metodunu kullanıyor
- `CartMapper` + `CartItemMapper` var ama `CartServiceImpl` karışık kullanıyor
- `SiteSettingsMapper`, `BlogMapper`, `ActivityLogMapper`, `StatsMapper`, `ReportMapper` **hiç yok**

**Çözüm:** Mapper kullanımı standardize edilmeli. Mevcut mapper'ları aktif kullanıma al, eksik olanları oluştur.

### 8. `createCoupon()` ve Overloaded Metot Tutarsızlığı
`CouponServiceImpl` içinde 2 farklı `createCoupon()` metodu var:
1. `createCoupon(String code, BigDecimal discountAmount, BigDecimal minCartAmount, int daysValid)` — primitive
2. `createCoupon(CouponRequest request)` — DTO tabanlı

İkisi de farklı alanlar set ediyor (`discountType`, `perUserLimit`, `description` gibi alanlar sadece DTO versiyonunda).

**Çözüm:** Primitive parametreli versiyonu kaldır, sadece `CouponRequest` DTO versiyonunu tut.

---

## MODEL KATMANINDAKİ SORUNLAR

### 1. SiteSettings — God Entity (162 satır, 50+ alan)
Tek entity'de mağaza, firma, iletişim, teslimat, sosyal medya, SEO, SMTP, ödeme, SMS, para birimi, bakım modu alanları. Herhangi bir yapılandırma grubundaki değişiklik tüm entity'yi etkiliyor.

**Çözüm:** JPA `@Embedded` sınıfları kullanarak gruplandırma:
```
SiteSettings
├── @Embedded StoreConfig (storeName, businessType, storeDescription)
├── @Embedded CompanyConfig (companyName, taxId, taxOffice)
├── @Embedded ContactConfig (phone, email, website, address, whatsapp, weekdayHours, saturdayHours)
├── @Embedded ShippingConfig (standardDelivery, expressDelivery, freeShippingMin, ...)
├── @Embedded SocialConfig (facebook, instagram, twitter, youtube, tiktok)
├── @Embedded SeoConfig (metaTitle, metaDescription, metaKeywords, ...)
├── @Embedded SmtpConfig (smtpHost, smtpPort, smtpUsername, smtpPassword, ...)
├── @Embedded SmsConfig (smsProvider, smsApiKey, smsApiSecret, ...)
├── @Embedded PaymentGatewayConfig (paymentProvider, paymentApiKey, ...)
└── @Embedded MaintenanceConfig (maintenanceMode, maintenanceMessage)
```

### 2. Product — Slug Oluşturma (13 satır inline)
`Product` modeli içinde `generateSlug()` metodu Türkçe karakter dönüşümü yapıyor. Aynı mantık `BlogPost` için de gerekli.

**Çözüm:** `util/SlugUtils.java` → `generateSlug(String text)` ortak utility.

---

## PAKET YAPISI (Package Structure)

### Mevcut Yapı (İyi Yönleri)
- Controller interface/impl ayrımı ✅
- Service interface/impl ayrımı ✅
- Event-driven bildirim sistemi ✅ (OrderEvent/OrderEventListener)
- AOP ile aktivite loglama ✅
- Strategy pattern ile ödeme ✅ (PaymentStrategy)
- Specification pattern ile sorgulama ✅
- Ortak exception hiyerarşisi ✅ (BaseException → BadRequest, NotFound)
- Rate limiting ✅
- Global exception handler ✅

### Eksik/İyileştirilmesi Gereken
- `service/payment/impl/` içinde sadece `MockPaymentStrategy` var — gerçek ödeme entegrasyonu yapıldığında strategy'ler buraya eklenecek ✅ (yapı hazır)
- `mapper/` paketinde 6+ eksik mapper
- Event'ler dağınık: `event/` paketi var ama `SupportTicketServiceImpl` içinde inline `TicketReplyEvent` record tanımlı
- Specification'lar `repository/specification/` altında — 3 tane var, yeterli

---

## ÖNCELİK SIRASI (düzeltme planı için)

1. **`OrderServiceImpl`** — En çok sorumluluk yığılması (512 satır), stok yönetimi + orkestrasyon + sorgulama + fatura + timeline
2. **`RestSiteSettingsController` + `SiteSettings` entity** — Controller'da 130 satır mapping + God Entity
3. **`ReportServiceImpl`** — 5 farklı rapor + N+1 sorgu riskleri + SQL yerine Java filtreleme
4. **`CartServiceImpl`** — Stok validasyonu tekrarı + kupon mantığı
5. **`ActivityLoggingAspect`** — 9 domain, 17 pointcut tek dosyada
6. **`RestOrderControllerImpl`** — Yetkilendirme tekrarı + service ile tutarsız iş kuralı
7. **`AuthService`** — Profil güncelleme + getMe() yanlış katmanda
8. **`EmailTemplates`** — Hardcoded HTML + firma bilgileri
9. **`InvoicePdfServiceImpl`** — Hardcoded firma bilgileri + stil sabitleri
10. **DTO Mapper standardizasyonu** — 6+ eksik mapper, mevcut mapper'lar kullanılmıyor
11. **Yetkilendirme merkezileştirme** — 6+ yerde tekrar eden owner/admin kontrolü
12. **DataInitializer** — Admin oluşturma + seed data ayrımı
