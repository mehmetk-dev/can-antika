# Can Antika Performans ve Darboğaz Analizi

Tarih: 11 Nisan 2026  
Kapsam: Tüm proje (Frontend + Backend + Veritabanı + SSR akışı + Coolify/Dockerfile deploy)

## 1) Teknoloji Yığını (Tech Stack) Keşfi

Frontend:
- Next.js App Router (React 19 + TypeScript)
- Tailwind CSS
- İstemci tarafı özel API client katmanı (`lib/api-client.ts`)

Backend:
- Spring Boot 3.2.x (Java 17)
- Spring Data JPA (Hibernate), Specification API
- Flyway migration
- Redis cache + rate limiting

Veritabanı:
- PostgreSQL 15

Deploy/Infra:
- Frontend ve backend ayrı Dockerfile
- Coolify üzerinde Dockerfile tabanlı deploy
- Prod compose senaryosu mevcut (`docker-compose.prod.yml`)

## 2) SSR Odaklı İnceleme (Ürünler ve Ürün Detay)

Ürünler sayfası SSR akışı:
- `app/(main)/(alisveris)/urunler/page.tsx` içinde kategori + dönem (`Promise.allSettled`) ve ardından ürün listesi çekiliyor.
- Ürün istekleri `fetchApiDataWithFallback` ile timeout yarışı (`Promise.race`) üzerinden gidiyor.

Ürün detay sayfası SSR akışı:
- `generateMetadata` içinde ürün fetch ediliyor, sayfa renderında `ProductResolver` içinde tekrar aynı resolver akışı kullanılıyor.
- Sayfada hem server shell (`#product-ssr-shell`) hem de tam client detay bileşeni (`ProductPageClient`) birlikte render ediliyor.

## 3) Bulgular (Önem Sırasına Göre)

### Kritik-1: Ürün detay sayfasında çift render (SSR shell + tam client detay)
Sorun: `app/(main)/(alisveris)/urun/[slug]/page.tsx` içinde server shell (`id="product-ssr-shell"`) render ediliyor ve aynı request’te `ProductPageClient` da tam detay UI’ı render ediyor. `product-page-client.tsx` mount sonrası shell’i `display:none` yapıyor.  
Neden Yavaşlatır: HTML payload ve DOM boyutu büyüyor; server render maliyeti artıyor; LCP/TTFB olumsuz etkileniyor.  
Çözüm Önerisi: Tek render stratejisine geçin. En doğru yaklaşım: detayın statik/okuma kısmını server component’te tutup yalnızca etkileşimli parçaları client island yapısı ile ayırın. Shell + full client duplicate yapıyı kaldırın.  
İlgili Dosyalar:  
- `can-antika-frontend/app/(main)/(alisveris)/urun/[slug]/page.tsx` (193, 245)  
- `can-antika-frontend/app/(main)/(alisveris)/urun/[slug]/product-page-client.tsx` (29)

### Kritik-2: SSR fetch timeout yaklaşımı veriyi boş döndürüp istemciye ikinci yük bindiriyor
Sorun: `fetchApiDataWithFallback` timeout’u `Promise.race` ile uyguluyor; timeout durumunda `null` dönüyor (fetch arka planda sürse bile). Ürün liste (`timeoutMs: 800`) ve detay (`timeoutMs: 1500`) için bu çok agresif.  
Neden Yavaşlatır: İlk SSR cevap boş/eksik dönebilir, ardından client tarafında tekrar fetch tetiklenir; kullanıcı “sayfa geç açılıyor” hissi yaşar.  
Çözüm Önerisi: SSR kritik endpointlerde timeout’u yükseltin (özellikle JVM cold start senaryosu için), “null döndü => client refetch” modelini azaltın, kritik rotalarda fail-fast yerine “bekle ama tek fetch” stratejisi uygulayın.  
İlgili Dosyalar:  
- `can-antika-frontend/lib/server/server-api-fallback.ts` (49, 50, 57, 70, 88, 103)  
- `can-antika-frontend/app/(main)/(alisveris)/urunler/page.tsx` (43, 48)  
- `can-antika-frontend/app/(main)/(alisveris)/urun/[slug]/page.tsx` (51, 58)

### Kritik-3: Sipariş listelerinde backend N+1 sorgu riski
Sorun: `OrderServiceImpl.toOrderResponsePage` her siparişi `toOrderResponse` ile map’liyor; burada `orderItems` ve ürün lookup akışı sipariş bazlı tekrar ediyor. `OrderRepository` sayfalı metotlarında fetch planı optimize değil (EntityGraph import var, kullanım yok).  
Neden Yavaşlatır: Sipariş hacmi arttıkça query sayısı katlanır, admin/sipariş ekranları yavaşlar.  
Çözüm Önerisi: Sipariş listeleme için `@EntityGraph`/fetch join ve ürün map’ini page scope’ta tek batch query ile kurun.  
İlgili Dosyalar:  
- `e-commerce/src/main/java/com/mehmetkerem/service/impl/OrderServiceImpl.java` (344, 358, 375, 382, 385)  
- `e-commerce/src/main/java/com/mehmetkerem/repository/OrderRepository.java` (27, 30)

### Kritik-4: Ürün detay resolver’ında ardışık çoklu endpoint denemesi
Sorun: Slug çözümlemede `id -> trailing id -> slug -> full slug` şeklinde sıralı deneme var; her adım timeout’a girebilir.  
Neden Yavaşlatır: Özellikle soğuk başlangıç veya ağ jitter anlarında TTFB katlanır.  
Çözüm Önerisi: Kanonik URL standardını zorunlu kılın (`slug-id`), önce tek deterministic lookup yapın; fallback zincirini azaltın veya paralel hedge stratejisine çevirin.  
İlgili Dosyalar:  
- `can-antika-frontend/app/(main)/(alisveris)/urun/[slug]/page.tsx` (66, 75, 81, 86)

### Kritik-5: “Sipariş detay” endpoint’i tekil yerine liste çekip istemcide filtreliyor
Sorun: `getMyOrderById` tek sipariş için `/my-orders?page=0&size=100` çağırıp client’ta `find` yapıyor.  
Neden Yavaşlatır: Gereksiz payload, gereksiz CPU ve 100 sipariş üstünde doğruluk problemi.  
Çözüm Önerisi: Backend’de `GET /v1/order/my-orders/{id}` endpoint’i eklenmeli; frontend bunu direkt kullanmalı.  
İlgili Dosyalar:  
- `can-antika-frontend/lib/api/commerce/order.ts` (13-17)  
- `can-antika-frontend/app/(main)/hesap/siparisler/[id]/page.tsx` (30)

### Kritik-6: Yorum yönetiminde N+1 + pagination eksikliği
Sorun: `findAllReviews()` tüm yorumları çekip her kayıt için user/product detay çağrısı yapıyor; admin UI da tümünü toplu alıyor.  
Neden Yavaşlatır: Veri büyüdükçe admin yorum sayfası ciddi yavaşlar.  
Çözüm Önerisi: Sayfalama zorunlu hale getirilmeli; review-user-product birleşik projection/fetch planı uygulanmalı; user lookup tek batch yapılmalı.  
İlgili Dosyalar:  
- `e-commerce/src/main/java/com/mehmetkerem/service/impl/ReviewServiceImpl.java` (113-115, 139, 149)  
- `can-antika-frontend/lib/api/catalog/review.ts` (5-6)  
- `can-antika-frontend/app/admin/(kullanicilar)/yorumlar/page.tsx` (24-25)

### Kritik-7: Excel import satır başına DB yoğun işlem yapıyor
Sorun: Import akışında satır başına kategori doğrulama + kayıt + slug çakışma kontrol döngüsü var (`existsBySlug` tekrarları).  
Neden Yavaşlatır: Büyük dosyalarda DB round-trip ve işlem süresi ciddi artar.  
Çözüm Önerisi: Ön yükleme (kategori map), batch persist ve slug üretiminde collision kontrolünün maliyetini düşüren strateji (örn. deterministic suffix + unique index retry) uygulanmalı.  
İlgili Dosyalar:  
- `e-commerce/src/main/java/com/mehmetkerem/service/impl/ProductServiceImpl.java` (367, 375, 396, 421, 428)

### Orta-1: Ürün liste SSR’ında gereksiz sıralı bekleme
Sorun: `urunler/page.tsx` içinde kategori/dönem resolve tamamlanmadan ürün fetch başlamıyor (özellikle filtre yokken gereksiz).  
Neden Yavaşlatır: İlk açılışta TTFB yükselir.  
Çözüm Önerisi: Filtre yoksa ürün fetch’i kategori/dönem ile paralel başlatın; sadece ad->id çözümleme gerektiğinde bağımlı akış kullanın.  
İlgili Dosyalar:  
- `can-antika-frontend/app/(main)/(alisveris)/urunler/page.tsx` (104-106, 140)

### Orta-2: Ürünler sayfasında `Suspense` pratikte fayda üretmiyor
Sorun: Sayfa verileri await edildikten sonra `CatalogClient` `Suspense` içine konulmuş.  
Neden Yavaşlatır: Streaming/skeleton beklentisi oluşsa da sunucu tarafında gecikme düşmüyor.  
Çözüm Önerisi: Gerçek streaming için veri beklenen bölümü ayrı async server component olarak bölün veya `Suspense` katmanını veri akışıyla uyumlu yeniden düzenleyin.  
İlgili Dosyalar:  
- `can-antika-frontend/app/(main)/(alisveris)/urunler/page.tsx` (157-166)

### Orta-3: `initialProducts.length > 0` kontrolü boş ama geçerli SSR sonucunu yanlış yorumluyor
Sorun: SSR sonucu boş liste (valid) olduğunda `hasInitialData=false` kabul edilip client fetch tekrar tetikleniyor.  
Neden Yavaşlatır: Gereksiz ikinci ağ çağrısı ve gecikme.  
Çözüm Önerisi: “SSR tamamlandı mı” bilgisini ayrı boolean prop ile taşıyın; boş sonuçla timeout/başarısız sonucu ayırın.  
İlgili Dosyalar:  
- `can-antika-frontend/hooks/useCatalogFilters.ts` (43, 50, 217-218)

### Orta-4: Ürün arama sorgusu `%like%` yaklaşımıyla full-scan eğiliminde
Sorun: `lower(title) like '%...%'` sorgusu trigram/full-text yoksa büyük tabloda pahalı.  
Neden Yavaşlatır: Arama endpoint’i gecikir, header araması da bu endpoint’i sık çağırıyor.  
Çözüm Önerisi: PostgreSQL `pg_trgm` + GIN index (veya FTS) eklenmeli; gerekiyorsa minimum karakter eşiği artırılmalı.  
İlgili Dosyalar:  
- `e-commerce/src/main/java/com/mehmetkerem/repository/specification/ProductSpecification.java` (17, 22-23)  
- `can-antika-frontend/hooks/useProductSearch.ts` (26-27, 39)

### Orta-5: Ürün görselleri `EAGER` yüklendiği için liste sorguları şişiyor
Sorun: `Product.imageUrls` alanı `@ElementCollection(fetch = EAGER)`.  
Neden Yavaşlatır: Liste/sorgu endpoint’lerinde gereksiz veri yüklenir, memory ve query maliyeti büyür.  
Çözüm Önerisi: `LAZY` + liste DTO/projection ile sadece gerekli görsel alanlarını döndürün.  
İlgili Dosyalar:  
- `e-commerce/src/main/java/com/mehmetkerem/model/Product.java` (50, 53, 54)

### Orta-6: İstatistik kırılımında status başına ayrı query
Sorun: Sipariş durum dağılımı loop içinde ayrı sayım çağrılarıyla üretiliyor.  
Neden Yavaşlatır: Dashboard’da gereksiz query çarpanı oluşturur.  
Çözüm Önerisi: Tek `GROUP BY` sorgusuna geçin.  
İlgili Dosyalar:  
- `e-commerce/src/main/java/com/mehmetkerem/service/impl/StatsServiceImpl.java` (126, 129)

### Orta-7: Abandoned cart raporunda lazy item erişimi N+1 üretebilir
Sorun: Cart page’i çekildikten sonra `cart.getItems()` döngüsü var.  
Neden Yavaşlatır: Kayıt sayısı arttıkça ek sorgu maliyeti doğurur.  
Çözüm Önerisi: EntityGraph/projection ile rapor için gerekli item özetlerini toplu alın.  
İlgili Dosyalar:  
- `e-commerce/src/main/java/com/mehmetkerem/service/impl/ReportServiceImpl.java` (133, 153-154, 179)

### Orta-8: Sipariş expiry task satır bazlı save + stock revert yapıyor
Sorun: Expire döngüsünde her order için ayrı save ve revert çağrısı var.  
Neden Yavaşlatır: Batch yerine N adet işlem maliyeti oluşur.  
Çözüm Önerisi: Toplu status update + toplu stock düzeltme stratejisine geçin.  
İlgili Dosyalar:  
- `e-commerce/src/main/java/com/mehmetkerem/config/OrderExpiryTask.java` (44, 50, 52, 55)

### Orta-9: Ürün detayında mount sonrası ek API yükü
Sorun: Detay sayfası açılınca related products ve cart kontrolü için ek çağrılar tetikleniyor; header da ayrıca cart/wishlist sayacı çekiyor.  
Neden Yavaşlatır: Özellikle mobilde ilk etkileşim sırasında gereksiz network yarışları oluşur.  
Çözüm Önerisi: Cart state’i global cache/store üzerinden paylaşın; related ürünleri SSR payload’a sınırlı olarak ekleyin veya idle’a erteleyin.  
İlgili Dosyalar:  
- `can-antika-frontend/app/(main)/(alisveris)/urun/[slug]/product-page-client.tsx` (128, 139)  
- `can-antika-frontend/hooks/useProductActions.ts` (34)  
- `can-antika-frontend/hooks/useCartWishlistCounts.ts` (12, 17)

### Orta-10 (Coolify): SSR API adayları deploy topolojisine duyarlı
Sorun: Production aday URL’lerinde `http://backend:8080` sabit adayı var. Coolify’de servis adı/alias farklıysa fast-path kaçırılabilir veya fallback’e kalınır.  
Neden Yavaşlatır: SSR ilk isteklerde timeout/fallback gecikmesi üretir.  
Çözüm Önerisi: Coolify’de `INTERNAL_API_URL` kesin tanımlı olmalı; frontend ve backend aynı private network üzerinde net DNS adıyla eşlenmeli; fallback listesi deploy topolojisine göre sadeleştirilmeli.  
İlgili Dosyalar:  
- `can-antika-frontend/lib/server/server-api-url.ts` (24, 27, 29-32)

### Düşük-1 (Coolify): `.dockerignore` eksikliği build context’i şişirebilir
Sorun: Frontend/backend dizinlerinde `.dockerignore` bulunmuyor.  
Neden Yavaşlatır: Coolify remote build context transferi büyür, build süresi ve cache verimi düşer.  
Çözüm Önerisi: En azından `.git`, `node_modules`, `.next`, log/cache dosyaları, local env/artifact dosyaları ignore edilmeli.  
İlgili Dosyalar:  
- `can-antika-frontend/Dockerfile`  
- `e-commerce/Dockerfile`

### Düşük-2: Frontend build’de `pnpm@latest` kullanımı deterministik değil
Sorun: Docker build base katmanında `pnpm@latest` aktive ediliyor.  
Neden Yavaşlatır: Versiyon kaymaları cache invalidation ve öngörülemez build süreleri doğurur.  
Çözüm Önerisi: pnpm sürümünü sabitleyin (örn. `pnpm@9.x.y`) ve lockfile ile deterministik build sürdürün.  
İlgili Dosyalar:  
- `can-antika-frontend/Dockerfile` (2)

## 4) Önceliklendirilmiş Hızlı Aksiyon Planı

1. Ürün detaydaki çift render mimarisini kaldırın (`product-ssr-shell` + full client duplicate).  
2. SSR timeout stratejisini revize edin (`fetchApiDataWithFallback` + ürün sayfası timeout değerleri).  
3. Sipariş ve yorum tarafındaki N+1 sorguları fetch plan/projection ile düzeltin.  
4. Ürün arama için trigram/FTS indeks ekleyin ve sorgu planını iyileştirin.  
5. Coolify için `INTERNAL_API_URL` + `.dockerignore` + sabit pnpm sürümü ile deploy hattını stabilize edin.

