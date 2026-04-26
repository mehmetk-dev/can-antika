# Urun Detay Acilis Hizi Inceleme Raporu

Tarih: 26 Nisan 2026  
Kapsam: Urun liste -> urun detay tiklama akisi, Next.js frontend, Spring Boot backend, PostgreSQL/Redis ve Coolify Dockerfile deployment.

## Kisa Sonuc

Urun detay sayfasindaki yavaslik icin en guclu adaylar sunlar:

1. Urun detay sayfasinda ayni icerik iki kez render ediliyor: server shell ve tam client detay.
2. SSR API fallback/timeout stratejisi Coolify Dockerfile deployment'ta yanlis internal URL ile ekstra bekleme uretebilir.
3. Ilk product fetch basarili olmazsa client tekrar ayni resolver zincirini calistiriyor.
4. Sayfa hydrate olduktan sonra related products, view count ve authenticated kullanicida cart kontrolu ek network yuku olusturuyor.
5. Urun listesi ve related endpointleri tum `imageUrls` verisini tasidigi icin payload ve DB isi gereksiz buyuyebilir.

Bu rapor kod incelemesine dayali. Canli production metriklerine, Coolify loglarina ve tarayici waterfall kaydina bakilmadan kesin sureler soylemek dogru olmaz; ancak kod uzerindeki riskler net.

## Uygulanan Duzeltmeler

26 Nisan 2026 tarihinde uygulananlar:

- Urun detay sayfasindaki `#product-ssr-shell` cift render yapisi kaldirildi.
- Hydration sonrasi shell gizleme kodu kaldirildi.
- SSR API fallback fast-path istegi artik public API'yi 700 ms'de kesmiyor.
- Urun kartlarinda detay route otomatik prefetch'i kapatildi.
- Related products fetch'i idle zamana ertelendi.
- Authenticated kullanicida cart kontrolu idle zamana ertelendi.
- Katalog SSR bos sonuc ile SSR timeout/basarisiz sonuc ayrildi.
- Frontend Dockerfile icinde `pnpm@latest` yerine `pnpm@10.32.1` sabitlendi.
- Frontend ve backend icin `.dockerignore` dosyalari eklendi.
- Kart/liste ekranlari icin geriye uyumlu `ProductCardResponse` akisi eklendi.
- Katalog, yeni gelenler ve benzer urunler hafif kart endpointlerine tasindi.

## Incelenen Ana Dosyalar

- `can-antika-frontend/app/(main)/(alisveris)/urun/[slug]/page.tsx`
- `can-antika-frontend/app/(main)/(alisveris)/urun/[slug]/product-page-client.tsx`
- `can-antika-frontend/components/product/product-detail.tsx`
- `can-antika-frontend/components/product/image-gallery.tsx`
- `can-antika-frontend/lib/server/server-api-fallback.ts`
- `can-antika-frontend/lib/server/server-api-url.ts`
- `can-antika-frontend/Dockerfile`
- `e-commerce/src/main/java/com/mehmetkerem/service/impl/ProductServiceImpl.java`
- `e-commerce/src/main/java/com/mehmetkerem/model/Product.java`
- `e-commerce/src/main/java/com/mehmetkerem/repository/ProductRepository.java`
- `e-commerce/src/main/resources/db/migration/V4__add_product_performance_indexes.sql`
- `e-commerce/Dockerfile`
- `docker-compose.prod.yml`

## Bulgu 1 - Urun Detayda Cift Render

Kanıt:

- `page.tsx:193` server-rendered `#product-ssr-shell` uretiyor.
- `page.tsx:245` ayni response icinde `ProductPageClient` render ediliyor.
- `product-page-client.tsx:29` hydrate sonrasi shell DOM'dan kaldirilmiyor, sadece `display:none` yapiliyor.
- `product-detail.tsx:73` client detay icinde tekrar ana gorsel galerisi render ediliyor.
- `image-gallery.tsx` ana gorselde `priority` ve `fetchPriority="high"` kullaniyor.
- `page.tsx` shell icindeki ana gorselde de `priority` ve `fetchPriority="high"` kullaniyor.

Etkisi:

- HTML ve DOM boyutu gereksiz artiyor.
- Urun basligi, fiyat, aciklama ve ana gorsel iki farkli agacta uretiliyor.
- Ana gorsel iki farkli `Image` bileseni tarafindan high priority isaretlenebiliyor. Cloudinary loader farkli width varyantlari uretebildigi icin tarayici ayni ana gorselin birden fazla transformunu isteyebilir.
- Hydration is yuku artiyor; mobil cihazlarda "tikladim ama sayfa oturmadi" hissi yaratabilir.

Oncelikli cozum:

- `#product-ssr-shell` blokunu kaldirin.
- `ProductPageClient initialProduct={product}` zaten ilk urun verisi ile render ediliyor; bu yuzden ayni gorunur icerigi ikinci kez server shell olarak basmaya gerek yok.
- JSON-LD script'i server component'te kalabilir.
- Daha iyi mimari icin urun detayinin statik kisimlari server component, sepete ekleme/favori/paylasim gibi kisimlar client island olmalidir.

Beklenen kazanc:

- Daha kucuk HTML.
- Daha az hydration isi.
- Ana gorsel icin daha az duplicate preload riski.
- Ilk gosterim ve LCP tarafinda iyilesme.

## Bulgu 2 - SSR API Fallback Coolify'de Ek Bekleme Uretebilir

Kanıt:

- `server-api-url.ts:24-30` production'da once `INTERNAL_API_URL`, sonra sabit `http://backend:8080`, sonra `NEXT_PUBLIC_API_URL` adayini ekliyor.
- `server-api-fallback.ts:57` default timeout 1200 ms.
- `page.tsx:49` ve `page.tsx:56` urun detay fetch'lerinde timeout 1500 ms.
- `server-api-fallback.ts:70` onceki calisan URL icin timeout `Math.min(timeoutMs, 700)` ile 700 ms'e kirpiliyor.
- Frontend Dockerfile sadece `NEXT_PUBLIC_API_URL` build arg'i tanimliyor; `INTERNAL_API_URL` runtime env olarak Coolify panelinden verilmezse Dockerfile bunu kendisi saglamiyor.
- `docker-compose.prod.yml:53` compose senaryosunda `INTERNAL_API_URL=http://backend:8080` var; fakat kullanici Coolify'de Dockerfile ile yayinladigini belirtti. Bu durumda compose servis adi olan `backend` otomatik olarak gecerli olmayabilir.

Riskli senaryo:

1. Coolify'de frontend ve backend ayri Dockerfile app olarak calisiyor.
2. Frontend runtime ortaminda `INTERNAL_API_URL` yok veya yanlis.
3. `http://backend:8080` Coolify internal DNS tarafinda cozulmuyor.
4. SSR public API'ye (`https://api.canantika.com`) dusuyor.
5. Public API 700 ms'den uzun surerse fast-path once null donuyor, sonra fallback tekrar basliyor.
6. Kullanici urune tikladiginda TTFB gereksiz sekilde 700 ms veya daha fazla artabiliyor.

Oncelikli cozum:

- Coolify frontend uygulamasina runtime env olarak gercek internal backend URL'sini verin:
  - `INTERNAL_API_URL=http://<coolify-backend-service-host>:8080`
  - Bu host frontend container icinden cozulebilir olmali.
- Frontend build arg ve runtime env olarak public API URL ayni tutulmali:
  - `NEXT_PUBLIC_API_URL=https://api.canantika.com`
- Eger internal network kurulamiyorsa:
  - `server-api-url.ts` icindeki `http://backend:8080` fallback'i Coolify icin opsiyonel yapin.
  - `lastWorkingBaseUrl` public URL ise 700 ms cap uygulamayin veya cap'i 1500-2500 ms bandina cekin.

Dogru olculmesi gereken metrik:

- Frontend container icinden internal API latency:
  - `curl -w "%{time_connect} %{time_starttransfer} %{time_total}\n" -o /dev/null -s "$INTERNAL_API_URL/v1/product/1"`
- Public API latency:
  - `curl -w "%{time_connect} %{time_starttransfer} %{time_total}\n" -o /dev/null -s "https://api.canantika.com/v1/product/1"`
- Next loglarinda `[server-api-fallback]` satirlari ve hangi adayla dondugu.

## Bulgu 3 - Product Resolver Zinciri Sira Sira Endpoint Deniyor

Kanıt:

- `page.tsx:62` `fetchProduct` resolver basliyor.
- `page.tsx:66` tamamen numeric slug icin ID deneniyor.
- `page.tsx:75` sondaki ID deneniyor.
- `page.tsx:81` ID'siz slug deneniyor.
- `page.tsx:86` tam slug tekrar deneniyor.
- Client fallback tarafinda ayni mantik `product-page-client.tsx:47`, `:56`, `:66`, `:70` satirlarinda var.

Etkisi:

- Canonical URL `slug-id` ise genelde tek ID istegi ile biter.
- Canonical olmayan URL, eksik slug veya timeout durumunda zincir uzar.
- SSR timeout null dondururse client tekrar endpoint zincirine girer.

Oncelikli cozum:

- Liste kartlarinda zaten `getProductUrl(product)` ile `slug-id` uretiliyor. Bu format disina dusen URL'leri 301/replace ile erken normalize edin.
- `slug-id` varsa sadece ID lookup yapin; ID basarisizsa tek slug fallback yeterli.
- SSR tarafinda timeout'u veri yokmus gibi null'a cevirmek yerine hata nedenini ayirin: timeout, 404 ve network farkli ele alinmali.

## Bulgu 4 - `generateMetadata` Urun Fetch'ine Bagli

Kanıt:

- `page.tsx:95` `generateMetadata` icinde `fetchProduct(slug)` cagriliyor.
- `page.tsx:147` `ProductResolver` tekrar `fetchProduct(slug)` cagiriyor.
- React `cache()` ayni request icinde tekrar fetch'i azaltmak icin kullanilmis.

Etkisi:

- Duplicate fetch azaltildigi icin bu kisim tek basina en buyuk sorun degil.
- Ancak metadata urun verisini bekledigi icin ilk uncached request'te TTFB yine product endpoint'e bagli.

Oncelikli cozum:

- Product endpoint hızlı ve internal network uzerinden erisilebilir hale getirilmeli.
- Metadata icin daha kisa, projection tabanli bir endpoint dusunulebilir: `id`, `title`, `description`, `primaryImage`, `categoryName`.

## Bulgu 5 - Hydration Sonrasi Ek Network Yukleri

Kanıt:

- `product-page-client.tsx:109` view count idle callback ile POST ediyor.
- `product-page-client.tsx:128` ayni kategoriden related products cekiyor.
- `product-page-client.tsx:139` yeterli related yoksa son urunleri tekrar cekiyor.
- `useProductActions.ts` authenticated kullanicida mount sonrasi `cartApi.getCart()` ile tum sepeti kontrol ediyor.
- Header tarafinda `useCartWishlistCounts.ts:12` ve `:17` ayrica cart/wishlist sayaclari cekiliyor.

Etkisi:

- Bunlar SSR TTFB'yi direkt bloklamaz, fakat sayfa acilir acilmaz network tablosunu doldurur.
- Mobilde ve yavas baglantida ana urun endpoint'i, Cloudinary gorseli, related products ve cart istekleri ayni anda yarisir.
- Kullanici "sayfa geldi ama agir" hissi alabilir.

Oncelikli cozum:

- Related products fetch'ini LCP sonrasina erteleyin veya server tarafinda en fazla 4 urunluk hafif DTO ile gonderin.
- Sepette var mi kontrolu icin tum cart yerine hafif endpoint kullanin: `GET /v1/cart/contains?productId=...`.
- Header cart/wishlist sayacini global cache/store ile paylastirin; product detay mount'unda tekrar tum cart cekilmesin.
- View count zaten idle; Redis/DB sorunu varsa kullanici akisini etkilememesi dogru.

## Bulgu 6 - Backend Cache Var, Ama Coolify Env Kritik

Kanıt:

- `ProductServiceImpl.java:129` `products:byId` cache'i var.
- `ProductServiceImpl.java:336` `products:bySlug` cache'i var.
- `CacheConfig.java:24` `@EnableCaching`.
- `CacheConfig.java:45` Redis entry TTL 60 dakika.
- `application.properties:78` default `CACHE_TYPE=redis`.
- `application.properties:114` rate limit Redis hatasinda default fail-closed.
- `docker-compose.prod.yml:83-85` compose senaryosunda Redis env varlari veriliyor.

Etkisi:

- Redis dogru calisiyorsa populer urun detaylari backend'de hizli donmeli.
- Coolify Dockerfile deployment'ta Redis, DB ve backend ayri servislerse env varlar manuel dogru verilmelidir.
- Redis yanlis ise product GET cache tarafinda fallback ile DB'ye dusebilir. Product GET rate limit'ten muaf, fakat diger endpointler etkilenebilir.

Oncelikli cozum:

- Backend Coolify env kontrol listesi:
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_PASSWORD`
  - `CACHE_TYPE=redis`
  - `DB_URL`
  - `DB_USERNAME`
  - `DB_PASSWORD`
  - `SPRING_PROFILES_ACTIVE=prod` veya production profil standardiniz
- Backend loglarinda `Cache GET failed`, `Redis rate limit error`, `connection refused` aranmalı.

## Bulgu 7 - DB Indeksleri Iyi Baslamis, Ama DTO/Payload Sorunu Var

Kanıt:

- `V4__add_product_performance_indexes.sql:3` slug index var.
- `V4__add_product_performance_indexes.sql:6` category index var.
- `V4__add_product_performance_indexes.sql:9` period index var.
- `V4__add_product_performance_indexes.sql:12` product_images product_id index var.
- `Product.java:50` `imageUrls` `@ElementCollection(fetch = FetchType.EAGER)`.
- `Product.java:53` `@Fetch(FetchMode.SUBSELECT)`.

Etkisi:

- Tekil urun detayda tum gorseller gerekli olabilir.
- Fakat liste, arama ve related endpointleri de ayni `ProductResponse` ile tum `imageUrls` listesini tasiyorsa payload buyur.
- Urun listesi ilk acilista, related products fetch'inde ve olasi prefetchlerde gereksiz veri tasinabilir.

Oncelikli cozum:

- Liste/related icin ayri hafif DTO kullanin:
  - `id`, `slug`, `title`, `price`, `stock`, `category`, `primaryImageUrl`, `averageRating`, `reviewCount`
- Detay endpoint'i tam `imageUrls` dondurmeye devam edebilir.
- JPA tarafinda liste projection veya query DTO kullanarak `product_images` join/subselect maliyetini dusurun.

## Bulgu 8 - Urun Liste Link Prefetch Davranisi Kontrol Edilmeli

Kanıt:

- `catalog-client.tsx:202` urun kartlari `ProductCard` olarak render ediliyor.
- `product-card.tsx:30` `href={getProductUrl(product)}` var.
- `ProductCard` icindeki `Link` icin `prefetch={false}` verilmemis.
- Related products tarafinda ise `prefetch={false}` bilincli verilmis.

Etkisi:

- Next.js production'da viewport icindeki linkler icin prefetch davranisi gosterebilir.
- Urun grid'i cok sayida detay route prefetch'i uretirse backend/SSR uzerinde arka plan baskisi olusabilir.
- Bu her projede kesin sorun degil; tarayici Network waterfall ile dogrulanmali.

Oncelikli cozum:

- Detay sayfasi optimize edilene kadar ProductCard `Link` icin `prefetch={false}` deneyin.
- Alternatif: hover/pointer enter uzerinden kontrollu prefetch.

## Bulgu 9 - Urun Listesi Bos Sonucta Client Refetch Yapiyor

Kanıt:

- `useCatalogFilters.ts:43` `hasInitialData = initialProducts.length > 0`.
- `useCatalogFilters.ts:217-218` initial data yoksa client tekrar fetch yapiyor.

Etkisi:

- Bu doğrudan urun detay TTFB sorunu degil; ancak urun liste deneyimini ve tiklama oncesi network yukunu artirir.
- SSR basarili ama sonuc bos ise client bunu "SSR yok" sanarak tekrar fetch eder.

Oncelikli cozum:

- `hasInitialData` yerine `initialFetchCompleted` gibi ayri boolean prop kullanin.
- Bos sonuc ile timeout/fail sonucunu ayirin.

## Coolify Dockerfile Deployment Notlari

Kullanici projeyi Coolify uzerinden Dockerfile ile yayinladigini belirtti. Bu bilgi onemli, cunku repo icindeki `docker-compose.prod.yml` bazi dogru env degerlerini sagliyor; Dockerfile deployment'ta bunlar otomatik gelmez.

Frontend icin kritikler:

- Build arg:
  - `NEXT_PUBLIC_API_URL=https://api.canantika.com`
- Runtime env:
  - `NEXT_PUBLIC_API_URL=https://api.canantika.com`
  - `INTERNAL_API_URL=http://<backend-internal-host>:8080`
- Frontend ve backend ayni Coolify private network uzerinde olmali.
- `http://backend:8080` sadece servis DNS adi gercekten `backend` ise calisir.

Backend icin kritikler:

- DB ve Redis env varlari dogru olmali.
- Actuator health endpoint Coolify healthcheck icin kullanilmali: `/actuator/health`.
- JVM memory ayarlari `docker-compose.prod.yml` tarafinda var; Dockerfile deployment'ta Coolify env olarak `JAVA_TOOL_OPTIONS` verilmezse sadece Dockerfile ENTRYPOINT'teki `MaxRAMPercentage=75.0` kalir.

Build sureci icin notlar:

- Frontend Dockerfile `pnpm@latest` kullaniyor. Bu build deterministikligini bozabilir.
- Frontend ve backend dizinlerinde `.dockerignore` bulunmuyor. Coolify build context buyuyebilir; bu runtime click hizindan cok deploy/build hizini etkiler.

## Oncelikli Aksiyon Plani

### P0 - Ilk Ele Alinacaklar

1. Coolify frontend runtime env'de `INTERNAL_API_URL` degerini dogrulayin.
2. `server-api-fallback.ts` icindeki 700 ms fast-path cap'ini public URL icin uygulamayacak sekilde duzeltin.
3. Urun detaydaki `#product-ssr-shell` blokunu kaldirin.
4. Tek ana gorsel `priority/fetchPriority=high` kalsin.
5. Tarayici Network kaydi ile tiklama sonrasi document TTFB, RSC request ve Cloudinary gorsel sayisini olcun.

### P1 - Kisa Vadeli Kod Iyilestirmeleri

1. ProductCard linklerinde gecici olarak `prefetch={false}` deneyin.
2. Related products fetch'ini idle/LCP sonrasina erteleyin veya hafif DTO ile SSR'da sinirli gonderin.
3. Cart kontrolunu tum cart yerine product-specific lightweight endpoint ile yapin.
4. SSR timeout sonucunu `null` ile veri yokmus gibi gostermek yerine typed result ile ayirin.
5. Canonical `slug-id` rotasinda sadece ID lookup yapacak sekilde resolver zincirini sadelestirin.

### P2 - Backend ve DB Iyilestirmeleri

1. Liste/related endpointleri icin `ProductCardResponse` gibi hafif DTO ekleyin.
2. Product detail icin cache warming dusunun: admin urun kaydindan sonra veya ilk populer urunlerde `products:byId`/`products:bySlug`.
3. `EXPLAIN ANALYZE` ile slug ve category sorgularinin index kullandigini production DB'de dogrulayin.
4. Actuator Prometheus metriklerinde `/v1/product/{id}` ve `/v1/product/slug/{slug}` p95/p99 surelerini izleyin.

## Dogrulama Checklist

- Urun detay tiklamasinda document TTFB 300-600 ms bandina indi mi?
- `/_next` veya RSC request sayisi azaldi mi?
- Ana Cloudinary gorseli tek high-priority istek olarak mi geliyor?
- Console/backend loglarinda `[server-api-fallback]` public fallback uyari sayisi azaldi mi?
- Frontend container icinden `INTERNAL_API_URL` curl testi public API'den belirgin hizli mi?
- Redis cache hit oldugunda backend product endpoint p95 dusuyor mu?

## Tavsiye Edilen Ilk Kod Degisikligi

En dusuk riskli ilk degisiklik: `app/(main)/(alisveris)/urun/[slug]/page.tsx` icindeki server shell blokunu kaldirip sadece JSON-LD + `ProductPageClient initialProduct={product}` birakmak.

Bu degisiklik urun endpoint sozlesmesini degistirmez, backend'e dokunmaz ve duplicate render/gorsel preload riskini dogrudan azaltir. Ardindan Coolify `INTERNAL_API_URL` ayari ve `server-api-fallback.ts` 700 ms cap duzeltmesi gelmeli.
