# Can Antika — Kapsamlı Teknik Denetim Raporu

**Tarih:** 10 Mart 2026  
**Kapsam:** Next.js 16 (Frontend) + Spring Boot 3.2 (Backend)  
**Perspektif:** DevOps · Güvenlik Denetimi · Yazılım Mimarisi

---

## İçindekiler

1. [Mimari ve Çalışma Yapısı](#1-mimari-ve-çalışma-yapısı)
2. [Performans Analizi ve Darboğazlar](#2-performans-analizi-ve-darboğazlar)
3. [Güvenlik Denetimi](#3-güvenlik-denetimi)
4. [Aksiyon Planı ve İyileştirme Önerileri](#4-aksiyon-planı-ve-iyileştirme-önerileri)

---

## 1. Mimari ve Çalışma Yapısı

### 1.1 İstemci–Sunucu İletişim Modeli

| Katman | Teknoloji | Protokol |
|--------|-----------|----------|
| Frontend | Next.js 16 (App Router, React 19) | HTTPS → REST JSON |
| Backend | Spring Boot 3.2.2 (Java 17) | REST API (`/v1/*`) |
| Veritabanı | PostgreSQL 15 | JDBC (HikariCP) |
| Dosya Depolama | Cloudinary | SDK (HTTP) |
| E-posta | Resend SDK | HTTP API |

**İstek-Yanıt Döngüsü:**

```
Browser → Next.js (SSR/CSR) → Spring Boot REST API → PostgreSQL
                                    ↕
                              Cloudinary / Resend
```

Frontend'deki `api-client.ts` merkezi bir fetch wrapper'dır. Tüm istekler bu dosya üzerinden yönlendirilir. Standart bir `ResultData<T>` sarmalayıcısı (`{ status, message, code, data }`) her iki tarafta da tutarlı şekilde kullanılmaktadır.

**Olumlu Yönler:**
- `ResultData<T>` / `Result` wrapper'ı tüm endpoint'lerde tutarlı.
- Auto-refresh mekanizması: 401 yanıtında otomatik token yenileme ve isteğin tekrar denenmesi.
- `FormData` desteği (dosya yükleme) doğru şekilde ele alınmış.
- Backend controller'lar interface'lerden türetilmiş — Swagger/OpenAPI dokümantasyonu otomatik.

**Sorunlu Alanlar:**

| Bulgu | Açıklama |
|-------|----------|
| SSR'da API çağrıları `NEXT_PUBLIC_API_URL` kullanıyor | Sunucu taraflı render sırasında internal (Docker) URL yerine public URL kullanılıyor. Container ortamında gereksiz ağ çıkışı (hairpin NAT) oluşur. `INTERNAL_API_URL` ortam değişkeni tanımlanmalı. |
| Raw IP adresi config'te hardcoded | `next.config.mjs` içinde `116.202.106.185` IP'si image remote pattern olarak var. Domain'e bağlanmalı. |
| GraphQL / gRPC yok | Karmaşık admin dashboardlarında over-fetching riski mevcut. Mevcut durumda kabul edilebilir ancak ürün listesi + filtre + aggregate gibi çağrılarda çok sayıda ayrı endpoint'e istek gidiyor. |

### 1.2 Hata Yönetimi (Error Handling)

#### Backend (Spring Boot)

`GlobalExceptionHandler` (@RestControllerAdvice) aşağıdaki senaryoları yakalıyor:

| Exception | HTTP Status | Yanıt Mesajı |
|-----------|-------------|--------------|
| `BadCredentialsException` | 401 | "Hatalı e-posta veya şifre." |
| `AccessDeniedException` | 403 | "Bu işlemi yapmaya yetkiniz yok." |
| `InsufficientAuthenticationException` | 401 | "Oturum açmanız gerekiyor." |
| `BaseException` (custom) | Dinamik | Özel mesaj |
| `MethodArgumentNotValidException` | 400 | Alan bazlı validation hataları (Map) |
| `MaxUploadSizeExceededException` | 413 | "Dosya boyutu çok büyük (5MB max)" |
| `ObjectOptimisticLockingFailureException` | 409 | Concurrent modification |
| `Exception` (catch-all) | 500 | "Beklenmeyen bir hata oluştu." |

**Değerlendirme:** Catch-all handler stack trace'i loglıyor ama kullanıcıya generic mesaj dönüyor — doğru yaklaşım. Hassas bilgi sızıntısı riski düşük.

#### Frontend (Next.js)

- `error.tsx` — Sayfa düzeyinde error boundary. "Tekrar Dene" ve "Ana Sayfaya Dön" butonları.
- `global-error.tsx` — Root error boundary. `<html>` tag'i döndürüyor (Next.js zorunluluğu).
- `not-found.tsx` — 404 sayfası.
- `api-client.ts` içinde API hatası parse ediliyor; backend mesajı varsa o kullanılıyor; yoksa generic `API error: {status}` fırlatılıyor.

**Sorunlu Alan:**
- API client'ta `catch` bloklarının büyük çoğunluğu sessiz (`catch(() => {})`). Cart, wishlist, notification gibi çağrılarda hata yutulması UX sorunlarına yol açabilir.

### 1.3 Durum (State) ve Veri Yönetimi

#### Frontend State Yönetimi

| Mekanizma | Kullanım Alanı |
|-----------|----------------|
| React Context (`AuthProvider`) | Kimlik doğrulama, kullanıcı bilgisi, login/logout |
| React Context (`SiteSettingsProvider`) | Mağaza ayarları (fallback defaults dahil) |
| `localStorage` | JWT token, refresh token, cached user JSON |
| `useState` (yerel) | Form state, arama sonuçları, cart/wishlist sayaçları |
| Custom Events (`cart-updated`, `wishlist-updated`, `notification-updated`) | Cross-component iletişim |

**Değerlendirme:**
- Redux/Zustand gibi global state kütüphanesi kullanılmamış. Mevcut ölçekte Context API yeterli.
- `localStorage` kullanımı `window` kontrolü ile SSR-safe yapılmış.
- Custom event pattern'i bağımsız bileşenler arası haberleşme için fonksiyonel ancak ölçeklendiğinde bakım zorluğu yaratır.

#### Backend DTO Yapısı

| Katman | Sayı | Kullanım |
|--------|------|----------|
| Request DTO | 31 | `@Valid` ile validation, `@NotBlank`, `@Email`, `@Size`, `@Positive` |
| Response DTO | 32 | MapStruct ile entity→DTO dönüşümü |
| Generic Wrapper | `ResultData<T>`, `CursorResponse<T>` | Tutarlı response sarmalama |

**Olumlu Yönler:**
- MapStruct kullanımı boilerplate'i azaltıyor ve tip güvenliği sağlıyor.
- `CursorResponse<T>` pagination için standart bir yapı sunuyor.
- Validation annotation'ları DTO seviyesinde doğru uygulanmış.
- `PaymentRequest` içinde cross-field validation (transactionId zorunluluğu) `@AssertTrue` ile yapılmış.

---

## 2. Performans Analizi ve Darboğazlar

### 2.1 Next.js (Frontend) Cephesi

#### 2.1.1 Render Stratejileri

| Sayfa/Bileşen | Strateji | Uygunluk |
|----------------|----------|----------|
| `layout.tsx` (kök) | **SSR** — Site ayarları sunucu tarafında fetch edilip metadata oluşturuluyor | ✅ Doğru. `revalidate: 3600` ile ISR uygulanmış. |
| `page.tsx` (anasayfa) | **SSR** — Bakım modu kontrolü + metadata | ✅ Doğru. `revalidate: 60`. |
| `/urunler/page.tsx` | `export const dynamic = "force-dynamic"` → **SSR** (cache yok) | ⚠️ Tartışmalı. Filtre parametreleri değişken olduğu için anlaşılabilir, ancak filtresiz ilk yükleme için ISR kullanılabilir. |
| `/blog/page.tsx` | CSR (client component) | ⚠️ Blog listesi SEO açısından SSG/ISR olmalı. |
| Admin paneli | **CSR** (AuthGuard client component) | ✅ Doğru. Admin sayfaları index'e kapalı, authenticated. |
| Login/Register | **CSR** | ✅ Doğru. |

**Değerlendirme:** Genel strateji doğru. Kritik SEO sayfaları (ana sayfa, ürün detay) sunucu tarafında render ediliyor. Blog listesi SSR veya ISR'ye çekilebilir.

#### 2.1.2 Paket Boyutu ve Bağımlılıklar

`package.json` analizi (41 runtime bağımlılık):

| Bağımlılık | Kategori | Boyut Riski |
|------------|----------|-------------|
| `recharts` (2.15.4) | Grafik kütüphanesi | ⚠️ ~200KB gzipped. Yalnızca admin dashboard'da kullanılıyor; dynamic import ile lazy-load edilmeli. |
| 27 adet `@radix-ui/*` paketi | UI primitives | Her biri küçük ancak toplam sayı fazla. Tree-shaking ile yalnızca kullanılanlar dahil olmalı (Next.js bunu otomatik yapar). |
| `dompurify` (3.2.6) | XSS sanitization | ~15KB. Yalnızca blog sayfasında; dynamic import yapılabilir. |
| `embla-carousel-react` | Carousel | Yalnızca anasayfa; lazy load edilebilir. |

**Öneriler:**
- `recharts` → `next/dynamic` ile yalnızca admin route'larında lazy-load:
  ```tsx
  const SalesChart = dynamic(() => import("@/components/admin/sales-chart"), { ssr: false });
  ```
- Bundle analyzer (`@next/bundle-analyzer`) entegre edilmeli.

#### 2.1.3 Görsel ve Font Optimizasyonu

| Alan | Durum |
|------|-------|
| Font yükleme | ✅ `next/font/google` kullanılmış (Inter + Playfair Display). Variable font desteği ve `font-display: swap` otomatik. |
| Görsel optimizasyon | ✅ `next/image` kullanılmış. Cloudinary remote pattern tanımlı. `width`/`height` belirtilmiş. |
| Favicon | ✅ SVG + PNG (dark/light mode desteği). |
| OG Image | ⚠️ Static `/og-image.jpg` referansı var ama dosyanın varlığı doğrulanmalı. |

#### 2.1.4 Frontend Caching

| Mekanizma | Uygulama |
|-----------|----------|
| Next.js ISR | `layout.tsx` (3600s), `page.tsx` (60s) — site settings fetch. |
| `localStorage` cache | User object (`can_antika_user`) — flash kırpma önleme. |
| Polling | Notifications: 15 saniyede bir. ⚠️ WebSocket/SSE'ye göre verimsiz. |

**Sorun:** Notification polling (15s) her oturum açık kullanıcı için backend'e sürekli istek gönderiyor. 100 eşzamanlı kullanıcıda dakikada ~400 istek üretir. WebSocket veya SSE alternatifi değerlendirilmeli.

### 2.2 Spring Boot (Backend) Cephesi

#### 2.2.1 Veritabanı Etkileşimi — N+1 ve ORM Analizi

**Uygulanan Önlemler:**
- `ProductServiceImpl`: Batch fetch ile kategori yükleme — `Map<Long, CategoryResponse>` kullanılarak N+1 önlenmiş.
- `JpaSpecificationExecutor`: Dinamik filtreler tek sorgu ile yapılıyor.
- Native SQL (`@Query`): Analytics sorguları parameterized olarak güvenli şekilde yazılmış.
- DB İndeksleri: `order`, `activity_log`, `cart`, `review`, `payment` tablolarında uygun indeksler tanımlı.

**Potansiyel N+1 Riskleri:**

| Dosya | Sorun |
|-------|-------|
| `PasswordResetToken.java` | `@OneToOne(fetch = FetchType.EAGER)` — Her token sorgusu User'ı da çeker. `LAZY` olmalı. |
| `OrderItem` → Product ilişkisi | OrderItem'da product verisi denormalize edilmiş (title, price kopyası). Bu performans için doğru ancak verilerin senkronizasyonu manuel yönetilmeli. |
| `Cart` → `CartItem` → Product | Sepet yüklendiğinde tüm ürün detayları çekiliyor mu kontrol edilmeli. |

#### 2.2.2 Thread Yönetimi ve Asenkron İşlemler

| Bileşen | Yapılandırma |
|---------|--------------|
| `@Async` | `ActivityLogServiceImpl` ve `ResendNotificationService` üzerinde ~8 metot. |
| Thread Pool Config | ⚠️ **Eksik.** `@EnableAsync` aktif ancak custom `TaskExecutor` bean tanımlanmamış. Spring varsayılanı (`SimpleAsyncTaskExecutor`) her çağrıda yeni thread oluşturur — production'da kontrol dışı thread artışına yol açar. |
| `@Scheduled` | `OrderExpiryTask` (30 dk), `RateLimitFilter.cleanupStorage()` (5 dk) |

**Kritik Eksiklik — Thread Pool tanımı yok:**
```java
// ÖNERİ: AppConfig.java veya AsyncConfig.java içine eklenmeli
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean("taskExecutor")
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(15);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

#### 2.2.3 Connection Pool (HikariCP)

`application.properties` içinde HikariCP yapılandırması **hiç tanımlanmamış**. Spring Boot varsayılanları:

| Parametre | Varsayılan | Üretim Önerisi |
|-----------|------------|----------------|
| `maximum-pool-size` | 10 | 15–25 (trafik bağımlı) |
| `minimum-idle` | 10 | 5 |
| `connection-timeout` | 30s | 20s |
| `idle-timeout` | 600s | 300s |
| `max-lifetime` | 1800s | 1500s |
| `leak-detection-threshold` | 0 (kapalı) | 30000 (30s) |

**Önerilen yapılandırma (`application.properties`):**
```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1500000
spring.datasource.hikari.leak-detection-threshold=30000
```

#### 2.2.4 Backend Caching

| Durum | Detay |
|-------|-------|
| **Redis bağımlılığı** | `pom.xml`'de `spring-boot-starter-data-redis` mevcut |
| **Cache konfigürasyonu** | `spring.cache.type=none` ← **Cache devre dışı** |
| **@Cacheable annotation'ları** | `ProductServiceImpl` üzerinde 6 adet annotation yazılmış ama çalışmıyor |
| **CacheConfig.java** | `@EnableCaching` var ancak `spring.cache.type=none` bunu etkisizleştiriyor |

**Sonuç:** Caching altyapısı kodlanmış ama aktif değil. Production'a çıkmadan önce Redis bağlantısı sağlanıp `spring.cache.type=redis` yapılmalı. Mevcut cache key stratejisi uygun.

---

## 3. Güvenlik Denetimi

### 3.1 Spring Security Yapılandırması

#### Kimlik Doğrulama (Authentication)

| Mekanizma | Uygulama | Değerlendirme |
|-----------|----------|---------------|
| JWT (HS256) | Access Token: 30 dk, Refresh Token: 24 saat | ✅ |
| BCrypt | Parola hash'leme | ✅ |
| OAuth2 (Google) | OpenID Connect, redirect-based | ✅ |
| Refresh Token Rotation | Eski token silinip yeni oluşturuluyor | ✅ |
| Session Policy | `STATELESS` — sunucu tarafında oturum yok | ✅ |

#### Yetkilendirme (Authorization)

```
/v1/auth/*           → permitAll (login, register, forgot-password, reset-password)
/v1/product/** (GET) → permitAll
/v1/category/** (GET)→ permitAll
/v1/admin/**         → ROLE_ADMIN only
/v1/vendor/**        → ROLE_VENDOR || ROLE_ADMIN
Diğer tüm istekler   → authenticated
```

`@EnableMethodSecurity(securedEnabled = true, prePostEnabled = true)` aktif — controller seviyesinin yanı sıra method seviyesinde de yetki kontrolü yapılabiliyor.

**Order servisinde IDOR koruması:** Sipariş sorgularında `SecurityUtils` ile mevcut kullanıcı ID kontrolü yapılıyor — kullanıcı yalnızca kendi siparişlerini görebiliyor.

#### Güvenlik Başlıkları

| Başlık | Değer | Değerlendirme |
|--------|-------|---------------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline'; ...` | ⚠️ `'unsafe-inline'` açık — CSP bypass riski |
| X-Frame-Options | `DENY` | ✅ Clickjacking koruması |
| HSTS | `max-age=31536000; includeSubDomains` | ✅ |
| X-Content-Type-Options | `nosniff` | ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✅ |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | ✅ |

### 3.2 CORS Yapılandırması

**İki ayrı CORS konfigürasyonu var — potansiyel çakışma:**

1. `SecurityConfig.java` → `CorsConfigurationSource` bean
2. `WebMvcConfig.java` → `WebMvcConfigurer.addCorsMappings()`

Her ikisi de aynı `app.cors.allowed-origins` property'sini okuyor ancak **farklı varsayılan değerler** kullanıyor:
- `SecurityConfig`: `http://localhost:3000,http://localhost:5173`
- `WebMvcConfig`: `http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173`

**Risk:** Spring Security CORS zaten filter chain'de uygulandığı için `WebMvcConfig` tanımı gereksiz ve kafa karıştırıcı. İkisinden birini kaldırın (tercihen `WebMvcConfig`'i).

**Diğer CORS notları:**
- `allowedHeaders: *` — Production'da kabul edilebilir (JWT Bearer token göndermek için gerekli) ancak spesifik header listesi tercih edilebilir.
- `allowCredentials: true` — `allowedOrigins` ile birlikte kullanılıyor, wildcard (`*`) origin **değil** → doğru yapılandırılmış.

### 3.3 OWASP Top 10 Analizi

#### 3.3.1 SQL Injection

| Kontrol Noktası | Durum |
|-----------------|-------|
| JPA/Hibernate parametrized queries | ✅ Tüm repository çağrılarında parameterized |
| `@Query` annotation'ları | ✅ `:param` syntax ile parameterized |
| Native SQL sorguları | ✅ `OrderRepository` native SQL'leri parameterized |
| `JpaSpecificationExecutor` | ✅ Criteria API kullanıyor |
| `data.sql` | ✅ Hardcoded literal, dışarıdan girdi almıyor |

**Sonuç:** SQL injection riski **düşük**. JPA katmanı varsayılan olarak parameterized çalışıyor.

#### 3.3.2 XSS (Cross-Site Scripting)

| Vektör | Durum | Şiddet |
|--------|-------|--------|
| Blog content rendering | ✅ `DOMPurify.sanitize()` ile temizleniyor | — |
| `dangerouslySetInnerHTML` | ✅ Yalnızca 1 yerde kullanılıyor, sanitize edilmiş | — |
| `customHeadScripts` (Site Settings) | 🔴 **Sanitize edilmeden `<Script>` tag'ına enjekte ediliyor** | **KRİTİK** |
| CSP `script-src 'unsafe-inline'` | ⚠️ Inline script çalışmasına izin veriyor | ORTA |

**`customHeadScripts` Detay:**

Admin panelinden girilen `customHeadScripts` değeri backend'de hiçbir filtreleme olmadan veritabanına kaydediliyor. Frontend'de `layout.tsx` içinde:
```tsx
{customScripts && (
  <Script id="custom-head-scripts" strategy="afterInteractive">
    {customScripts}
  </Script>
)}
```
Eğer admin hesabı ele geçirilirse, tüm kullanıcıları etkileyen stored XSS saldırısı mümkün. 

**Önerilen Çözüm:**
- `customHeadScripts` alanı yalnızca bilinen analytics script kalıplarına (Google Analytics ID, Facebook Pixel ID) izin vermeli.
- Alternatif olarak, backend'de CSP-uyumlu bir whitelist veya admin tarafında çift onayla (2FA) korunmalı.

#### 3.3.3 CSRF

CSRF koruması `disabled`. JWT tabanlı stateless API'lerde CSRF token gerekli değildir çünkü:
- Token `Authorization` header'ında gönderiliyor (cookie değil).
- Cross-origin istekler otomatik JWT gönderemez.

**Sonuç:** ✅ Doğru şekilde devre dışı bırakılmış.

#### 3.3.4 Broken Access Control

| Kontrol | Durum |
|---------|-------|
| Admin route koruması | ✅ `.requestMatchers("/v1/admin/**").hasRole("ADMIN")` |
| IDOR koruması (Order) | ✅ `SecurityUtils` ile kullanıcı sahiplik kontrolü |
| IDOR koruması (Payment) | ✅ Ödemenin sahibi kontrol ediliyor |
| Fatura PDF erişimi | ✅ Daha önce güçlendirilmiş (repo notlarından) |
| Kupon tüketim akışı | ✅ Daha önce güçlendirilmiş |

### 3.4 Rate Limiting

| Bucket | Path | Limit | Pencere |
|--------|------|-------|---------|
| `auth` | `/v1/auth/` | 5 istek | 1 dakika |
| `payment` | `/v1/payment/` | 10 istek | 1 dakika |
| `api` (genel) | `/v1/` | 120 istek | 1 dakika |
| Global (fallback) | `*` | 60 istek | 1 dakika |

**Uygulama:** In-memory `ConcurrentHashMap` + sliding window. 5 dakikada bir cleanup.

**Sorunlar:**

| Sorun | Açıklama |
|-------|----------|
| In-memory depolama | Uygulamanın yeniden başlaması veya çoklu instance çalıştırılması halinde rate limit sıfırlanır. Redis tabanlı centralized rate limiting önerilir. |
| IP Spoofing riski | `X-Forwarded-For` header'ından ilk IP alınıyor. Proxy arkasında değilse bu header spoofable. Trusted proxy IP listesi yapılandırılmalı. |
| Admin endpoint'ler | Admin API'leri için ayrı rate limit bucket yok. Brute-force admin API abuse riski. |

### 3.5 Next.js (Frontend) Güvenliği

#### 3.5.1 Çevre Değişkenleri (Environment Variables)

| Değişken | Taraf | Risk |
|----------|-------|------|
| `NEXT_PUBLIC_API_URL` | İstemci | ✅ Yalnızca API base URL'i — hassas değil. |
| `NEXT_PUBLIC_SITE_URL` | İstemci | ✅ Yalnızca `robots.ts`'de — hassas değil. |

**Tüm hassas değişkenler (JWT_SECRET, DB_PASSWORD vb.) yalnızca backend'de.** Frontend'e API anahtarı sızması tespit edilmedi.

#### 3.5.2 Token ve Oturum Güvenliği

| Konu | Mevcut Durum | Risk | Önerilen |
|------|-------------|------|----------|
| Token depolama | `localStorage` | 🟠 XSS saldırısıyla erişilebilir | `HttpOnly` + `Secure` + `SameSite=Strict` cookie'ye taşınması |
| OAuth2 redirect | Token URL query param'da (`?token=...&refreshToken=...`) | 🟠 Tarayıcı geçmişi, referrer header'da sızabilir | Fragment (`#token=...`) veya backend session + cookie dönüşümü |
| User cache | `localStorage` (`can_antika_user`) | 🟡 Hassas veri ihtiva etmiyor (rol, isim, email) | Kabul edilebilir; gelecekte değişirse review gerekir |
| Refresh token rotation | Eski token siliniyor, yeni oluşturuluyor | ✅ | — |
| Token expiry | Access: 30dk, Refresh: 24 saat | ✅ | — |

#### 3.5.3 `middleware.ts` Eksikliği

Frontend'de **Next.js middleware yok**. Bu şu anlama gelir:
- Auth kontrolü tamamen client-side (`AuthGuard` component).
- Korumalı sayfalara unauthenticated kullanıcı ilk render'da kısa süreliğine erişebilir (flash).
- Bot/crawler'lar `src` dosyalarını görebilir (CSR olduğu ve içerik `isLoading` arkasında olduğu için pratik risk düşük).

**Önerilen:** Temel auth redirect'leri için `middleware.ts` eklenmesi:
```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("can_antika_token")?.value;
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isProtected = request.nextUrl.pathname.startsWith("/hesap") ||
                      request.nextUrl.pathname.startsWith("/sepet") ||
                      request.nextUrl.pathname.startsWith("/siparis");

  if ((isProtected || isAdmin) && !token) {
    return NextResponse.redirect(
      new URL(isAdmin ? "/admin/giris" : "/giris", request.url)
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/hesap/:path*", "/sepet/:path*", "/siparis/:path*"],
};
```
> **Not:** Bu yalnızca token'lar cookie'ye taşındıktan sonra çalışır. Mevcut `localStorage` tabanlı yapıda middleware token'a erişemez.

### 3.6 Sırların Yönetimi (Secrets Management)

🔴 **KRİTİK BULGU: `.env` dosyası çalışma dizininde mevcut ve production sırlarını içeriyor.**

`.env` dosyasında gözlemlenen sırlar:

| Sır | Değer (kısaltılmış) | Şiddet |
|-----|---------------------|--------|
| JWT_SECRET | `b3c7f2e8a91d...` (hex, 64 karakter) | 🔴 KRİTİK |
| APP_ADMIN_PASSWORD | `admin123` | 🔴 KRİTİK |
| DB_PASSWORD | `can_password` | 🔴 KRİTİK |
| CLOUDINARY_API_SECRET | `dnR2_CjaiL...` | 🔴 KRİTİK |
| CLOUDINARY_API_KEY | `789662353725967` | 🟠 Yüksek |

**Acil Aksiyon:**
1. `.env` dosyasını `.gitignore`'a ekleyin (zaten eklenmiş mi kontrol edin).
2. Tüm sırları **hemen** rotate edin (JWT_SECRET, DB_PASSWORD, Cloudinary API, admin şifresi).
3. Git geçmişinde bu dosya varsa `git filter-branch` veya `BFG Repo-Cleaner` ile temizleyin.
4. Production ortamında Docker secrets, Vault veya CI/CD ortam değişkenleri kullanın.

**`application.properties` varsayılan değerleri:**
```properties
jwt.secret=${JWT_SECRET:change-this-to-a-very-long-secret-key}
app.admin.password=${APP_ADMIN_PASSWORD:change-me}
spring.datasource.password=${DB_PASSWORD:change-me}
```
Varsayılan değerler zararsız fallback ama production'da mutlaka override edilmeli.

---

## 4. Aksiyon Planı ve İyileştirme Önerileri

### 4.1 🔴 Acil (Critical) — Production'dan Önce Yapılmalı

| # | Bulgu | Dosya | Aksiyon |
|---|-------|-------|---------|
| C1 | **Exposed `.env` dosyası** | `.env` | `.gitignore`'a eklendiğinden emin olun. Tüm sırları (JWT_SECRET, DB_PASSWORD, CLOUDINARY_API_SECRET, APP_ADMIN_PASSWORD) derhal rotate edin. Git geçmişini `BFG Repo-Cleaner` ile temizleyin. |
| C2 | **`customHeadScripts` Stored XSS** | `layout.tsx`, `SiteSettingsService.java` | Admin panelinden girilen script'ler sanitize edilmeli. Ya da bu alanı kaldırıp yalnızca GA/Pixel ID alanlarını kullanın. |
| C3 | **Admin şifresi `admin123`** | `DataInitializer.java`, `.env` | `@Profile("dev")` koruması var ama `.env` dosyasında da `admin123` tanımlı. Güçlü şifre zorunlu kılın. |
| C4 | **Thread pool eksik** | `@Async` methods | `ThreadPoolTaskExecutor` bean tanımlayın. Kontrolsüz thread artışını önleyin. |
| C5 | **Cache devre dışı** | `application.properties` | `spring.cache.type=redis` yapın, Redis container'ı docker-compose'a ekleyin. |
| C6 | **ddl-auto=update production'da** | `application.properties` | Production'da `validate` veya migration tool (Flyway/Liquibase) kullanın. |
| C7 | **Swagger UI production'da açık** | `SecurityConfig.java` | Production profile'ında Swagger endpoint'lerini kapatın. |

### 4.2 🟠 Orta (Medium) — İlk Sprint'te Ele Alınmalı

| # | Bulgu | Dosya | Aksiyon |
|---|-------|-------|---------|
| M1 | **Token'lar `localStorage`'da** | `api-client.ts` | `HttpOnly` + `Secure` + `SameSite=Strict` cookie'ye taşıyın. Backend'de cookie set eden endpoint ekleyin. |
| M2 | **OAuth2 token URL'de** | `OAuth2LoginSuccessHandler.java` | Fragment hash (`#`) kullanın veya backend'de token'ı cookie olarak set edip clean redirect yapın. |
| M3 | **HikariCP yapılandırması yok** | `application.properties` | Pool size, timeout, leak detection parametreleri ekleyin. (Bkz. §2.2.3) |
| M4 | **CORS çift tanım** | `SecurityConfig.java`, `WebMvcConfig.java` | `WebMvcConfig` CORS tanımını kaldırın, yalnızca `SecurityConfig` üzerinden yönetin. |
| M5 | **`CSP unsafe-inline`** | `SecurityConfig.java`, `next.config.mjs` | Nonce-based CSP'ye geçin. `'unsafe-inline'` kaldırılmalı. |
| M6 | **Notification polling (15s)** | `notifications-dropdown.tsx` | WebSocket veya SSE ile değiştirin. Polling interval'ı en az 60s'ye çıkarın. |
| M7 | **Blog listesi CSR** | `app/blog/page.tsx` | SSR veya ISR'ye çevirin (SEO için). |
| M8 | **In-memory rate limiting** | `RateLimitFilter.java` | Multi-instance deployment'ta çalışmaz. Redis-backed rate limiting (Bucket4j + Redis) önerilir. |
| M9 | **PasswordResetToken EAGER fetch** | `PasswordResetToken.java` | `FetchType.LAZY` yapın. |
| M10 | **`middleware.ts` yok** | Frontend root | Token cookie'ye taşındıktan sonra (M1) middleware ekleyerek server-side auth redirect yapın. |

### 4.3 🟢 Düşük (Low) — Backlog

| # | Bulgu | Dosya | Aksiyon |
|---|-------|-------|---------|
| L1 | **SSR'da internal API URL yok** | `layout.tsx`, `page.tsx` | `INTERNAL_API_URL` ortam değişkeni ekleyerek container-internal iletişim sağlayın. |
| L2 | **recharts tüm sayfalarla yükleniyor** | Admin dashboard | `next/dynamic` ile lazy-load edin. |
| L3 | **Hardcoded IP** | `next.config.mjs` | `remotePatterns`'daki `116.202.106.185` → domain'e çevirin. |
| L4 | **Bundle analyzer yok** | `package.json` | `@next/bundle-analyzer` ekleyin. |
| L5 | **Payment mock** | `MockPaymentStrategy.java` | Production'a gerçek payment gateway (iyzico, Stripe, etc.) entegre edin. |
| L6 | **Request correlation ID yok** | Backend | `MDC` + filter ile her isteğe UUID atayın. Log'larda uçtan uca takip sağlayın. |
| L7 | **Database migration tool yok** | Backend | Flyway veya Liquibase entegrasyonu yapın. `ddl-auto=validate` ile kullanın. |
| L8 | **Health check endpoint yok** | Docker compose | `/actuator/health` endpoint'ini aktifleştirin. Docker compose'a `healthcheck` ekleyin. |
| L9 | **Admin rate limit bucket yok** | `application.properties` | `/v1/admin/` prefix'i için ayrı rate limit bucket tanımlayın. |
| L10 | **Hata yutma (silent catch)** | Frontend bileşenler | Cart, wishlist, notification gibi çağrıların `catch` bloklarında en azından console.warn veya toast gösterin. |

### 4.4 Özet Matriks

```
┌──────────────────────────────────────────────────────────┐
│              PRODUCTION READINESS SCORECARD               │
├──────────────┬───────────────────────┬────────────────────┤
│ Kategori     │ Durum                 │ Not                │
├──────────────┼───────────────────────┼────────────────────┤
│ Mimari       │ ██████████░░ 80%      │ Temiz katmanlı     │
│ Güvenlik     │ ████████░░░░ 65%      │ .env + XSS kritik  │
│ Performans   │ ███████░░░░░ 60%      │ Cache kapalı       │
│ DevOps       │ ██████░░░░░░ 50%      │ Health check yok   │
│ Kod Kalitesi │ █████████░░░ 75%      │ DTO/Mapper iyi     │
│ Test         │ ████░░░░░░░░ 35%      │ Test coverage ?    │
└──────────────┴───────────────────────┴────────────────────┘
```

**Toplam 7 kritik, 10 orta, 10 düşük bulgu tespit edilmiştir.** Kritik bulgular kapatılmadan production'a çıkılmaması önerilir.

---

*Rapor sonu.*
