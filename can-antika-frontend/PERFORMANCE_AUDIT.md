# Can Antika — Kapsamlı Performans Denetim Raporu

**Proje:** Can Antika E-Ticaret Platformu  
**Tarih:** Haziran 2025  
**Çerçeve:** Next.js 16.1.6 (App Router) + React 19.2.0  
**Deploy:** Docker (standalone) — canantika.com  

---

## Yönetici Özeti

Bu rapor, Can Antika frontend uygulamasının **SSR veri akışı**, **kritik render yolu (CRP)**, **JavaScript bundle büyüklüğü**, **hidrasyon maliyeti**, **Core Web Vitals** ve **mimari kalıplar** açısından kapsamlı analizini içerir. Her bulgu **Etki** (Yüksek/Orta/Düşük) ve **Zorluk** (Kolay/Orta/Zor) ile derecelendirilmiştir.

### Kritik Bulgular Tablosu

| # | Bulgu | Etki | Zorluk | Metrik |
|---|-------|------|--------|--------|
| 1 | `CategoriesSection` client-side fetch (SSR bypass) | Yüksek | Orta | LCP, CLS |
| 2 | `middleware.ts` her istekte API call | Yüksek | Orta | TTFB |
| 3 | `DOMPurify` senkron import (blog detail) | Yüksek | Kolay | Bundle, TTI |
| 4 | Catalog `3500ms` timeout → TTFB şişmesi | Yüksek | Kolay | TTFB |
| 5 | `recharts` tam bundle import | Orta | Kolay | Bundle |
| 6 | İlişkili ürünler waterfall (2 ardışık API call) | Orta | Orta | INP |
| 7 | `Header` + `Footer` → client component boundary çok yukarıda | Orta | Zor | Hidrasyon |
| 8 | Blog listesi `size=50` → büyük payload | Orta | Kolay | TTFB |
| 9 | Font preload — iki ağır Google Font | Düşük | Kolay | LCP, CLS |
| 10 | `ignoreBuildErrors: true` → gizli tip hataları | Düşük | Orta | DX |

---

## 1. SSR Veri Akışı ve TTFB Analizi

### 1.1 Ana Sayfa (`app/(main)/page.tsx`)

**Mevcut Mimari:**
```
RootLayout (fetchSiteSettings — cache, revalidate: 300)
  └─ HomePage (fetchSiteSettings — cache, revalidate: 60)
       ├─ HeroSection (statik — 0 fetch)
       ├─ <Suspense> → NewArrivals (fetchApiDataWithFallback, revalidate: 120)
       ├─ <Suspense> → CategoriesSection ⚠️ CLIENT COMPONENT — useEffect fetch
       ├─ TrustIndicators (statik — 0 fetch)
       └─ <Suspense> → FeaturedStory (statik — 0 fetch)
```

**Sorun 1 — `fetchSiteSettings` çift çağırma (farklı revalidate):**

`RootLayout` → `revalidate: 300`, `HomePage` → `revalidate: 60`. React `cache()` aynı istek içinde dedup yapar ancak Next.js Data Cache farklı `revalidate` değerlerini **en kısa olanla** birleştirir. Pratikte sorun yok ama kafa karışıklığı yaratır.

> **Öneri:** `HomePage`'deki `fetchSiteSettings`'i kaldırın. `RootLayout` zaten `Providers`'a `initialSiteSettings` geçiriyor; `HomePage` bunu context'ten okumalı (SSR sırasında context'e değil, prop'a ihtiyaç var ise `layout.tsx`'ten children'a prop geçişi düşünün) ya da her ikisinde de aynı `revalidate` değerini kullanın.

**Sorun 2 — `CategoriesSection` tamamen istemci tarafı:**

```tsx
// components/home/categories-section.tsx
"use client"
useEffect(() => {
  categoryApi.getAllCached(true)  // client-side fetch
  categoryApi.getProductCounts(true)  // client-side fetch
}, [])
```

Bu bileşen `<Suspense>` içinde olmasına rağmen **server component değil**. SSR sırasında boş skeleton gönderilir, ardından istemcide 2 API call yapılır → **CLS + LCP gecikmesi**.

> **Öneri (Yüksek Etki, Orta Zorluk):**
> ```
> // components/home/categories-section.tsx → Server Component'e dönüştürün
> export async function CategoriesSection() {
>   const [cats, counts] = await Promise.all([
>     fetchApiDataWithFallback<CategoryResponse[]>("/v1/category/find-all", { revalidate: 300 }),
>     fetchApiDataWithFallback<Record<string, number>>("/v1/category/product-counts", { revalidate: 120 }),
>   ])
>   return <CategoriesSectionUI categories={cats} counts={counts} />
> }
> ```
> Böylece Suspense streaming ile HTML'de hazır gelir.

**Sorun 3 — `NewArrivals` timeout `3000ms`:**

```tsx
fetchApiDataWithFallback("/v1/product?...", { timeoutMs: 3000 })
```

Docker internal network'te backend <50ms cevap veriyor. 3 saniyelik timeout gereksiz yüksek. Timeout sadece anomali durumları için; TTFB'ye minimum etki eder ama `tryFetch`'teki `Promise.race` logic'i ile birlikte düşünüldüğünde ilk aday başarısız olursa toplam bekleme artar.

> **Öneri:** `timeoutMs: 1500` yeterlidir. `server-api-fallback.ts`'deki `lastWorkingBaseUrl` mekanizması zaten fast-path sağlıyor.

### 1.2 Katalog Sayfası (`app/(main)/(alisveris)/urunler/page.tsx`)

**Mevcut Mimari:**
```
CatalogPage (SSR):
  ├─ fetchInitialProducts (revalidate: 60, timeout: 3500ms)
  ├─ fetchCategories      (revalidate: 300, timeout: 2500ms)
  └─ fetchPeriods          (revalidate: 300, timeout: 2500ms)
  → Promise.allSettled([...]) — paralel ✅
  → <Suspense> → <CatalogClient initialProducts={...} />
```

**Sorun 4 — `3500ms` timeout → TTFB şişmesi (Yüksek Etki, Kolay):**

`Promise.allSettled` tüm promise'lerin settle olmasını bekler. En yavaş fetch `3500ms`'ye kadar bekleyebilir. Backend çökmüşse TTFB ≈ 3.5s olur.

> **Öneri:**
> 1. Timeout'ları `1500ms / 1200ms / 1200ms` olarak düşürün.
> 2. `Promise.allSettled` yerine her fetch için ayrı `Suspense` boundary kullanmayı düşünün:
> ```tsx
> <Suspense fallback={<CatalogSkeleton />}>
>   <CatalogDataLoader />
> </Suspense>
> ```
> Böylece streaming HTML ile kademeli yükleme mümkün olur.

**Sorun 5 — Hidrasyon sonrası gereksiz re-fetch:**

`CatalogClient` → `useCatalogFilters` hook'u:
```tsx
useEffect(() => {
  if (!hasInitialData || userInteracted) {
    fetchProducts()  // TEKRAR fetch
  }
}, [fetchProducts, hasInitialData, userInteracted])
```

`hasInitialData` true ise ve `userInteracted` false ise re-fetch **yapılmaz** ✅. Ancak URL'de `?category=X` veya `?period=Y` varsa, `useEffect` zincirleri şu sırayla çalışır:
1. `categoryParam` resolve → `setUserInteracted(true)` 
2. Bu `fetchTrigger`'ı artırır → `fetchProducts()` tetiklenir

Bu, SSR'dan gelen veriyi **anında invalidate eder** ve aynı sorguyu istemcide tekrar yapar.

> **Öneri (Orta Etki):** URL parametreleri varsa SSR'daki `fetchInitialProducts` fonksiyonuna da aynı filtreleri uygulayın. `searchParams`'ı `page.tsx`'e okuyup server-side filtrelenmiş sonuç iletin.

### 1.3 Ürün Detay Sayfası (`app/(main)/(alisveris)/urun/[slug]/page.tsx`)

**Mevcut Mimari:**
```
ProductPage (SSR):
  → fetchProduct(slug) — cache() + 3-phase lookup
  → <Suspense fallback={<ProductLoading />}>
       <ProductResolver slug={slug} />
     </Suspense>
       → <ProductPageClient initialProduct={product} slug={slug} />
           → useEffect: canonical redirect
           → useEffect: incrementViewCount
           → useEffect: loadRelatedProducts (2 ardışık API call) ⚠️
```

**Mevcut Pozitifler:** ✅ 3-phase fallback (pure ID → slug → trailing-ID), ✅ JSON-LD, ✅ Image preload, ✅ `cache()` dedup.

**Sorun 6 — İlişkili ürünler waterfall (Orta Etki):**

```tsx
// product-page-client.tsx
useEffect(() => {
  const sameCategoryResult = await productApi.search({ categoryId, size: 12 }, 2000)
  // 4'ten az ise:
  const latestProducts = await productApi.getAll(0, 20, "id", "desc")  // 2. CALL
}, [productId, categoryId])
```

İki ardışık istemci-tarafı API call. Ayrıca `size: 12` ve `size: 20` gereksiz büyük (sadece 4 ürün gösterilecek).

> **Öneri:**
> 1. Backend'e `/v1/product/{id}/related?limit=4` endpoint'i ekleyin → tek call.
> 2. Veya server component olarak SSR sırasında fetch edin:
> ```tsx
> // page.tsx → ProductResolver içinde
> const relatedProducts = await fetchApiDataWithFallback(
>   `/v1/product?categoryId=${product.category?.id}&size=5&sortBy=id&direction=desc`
> )
> ```
> 3. Minimum olarak: `size: 12` → `size: 5`, `size: 20` → `size: 5`.

**Sorun 7 — View count client-side fire:**

```tsx
useEffect(() => {
  void productApi.incrementViewCount(productId).catch(() => {})
}, [productId])
```

Her navigasyon ve hidrasyon'da tetiklenir. Bot trafiği de sayılır. Bu performans sorunu değil ama data integrity sorunu.

> **Öneri:** Bu isteği `requestIdleCallback` veya `setTimeout(fn, 2000)` ile geciktirin. Böylece hidrasyon sırasında ağ bant genişliğini tüketmez.

### 1.4 Blog Sayfaları

**Sorun 8 — Blog listesi `size=50` (Orta Etki, Kolay):**

```tsx
// app/(main)/blog/page.tsx
fetchApiDataWithFallback("/v1/blog?page=0&size=50", { revalidate: 60 })
```

50 blog yazısı tek seferde çekilir. Payload kolayca 200-500KB olabilir (title + content + images).

> **Öneri:** `size=12` ile sayfalama yapın. İstemci tarafında "Daha Fazla Göster" veya Intersection Observer ile lazy-load.

**Sorun 9 — `DOMPurify` senkron import (Yüksek Etki, Kolay):**

```tsx
// blog-detail-client.tsx
import DOMPurify from "dompurify"
```

`dompurify` ≈ 60KB (minified). Blog detay sayfasının JS bundle'ına statik olarak dahil edilir.

> **Öneri:**
> ```tsx
> const sanitizeHtml = async (dirty: string) => {
>   const DOMPurify = (await import("dompurify")).default
>   return DOMPurify.sanitize(dirty)
> }
> ```
> Veya server component'te sanitize edip HTML string olarak geçirin.

---

## 2. Middleware Analizi

### Sorun 10 — Her istekte bakım modu API check'i (Yüksek Etki, Orta)

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // ...
  const maintenanceMode = await readMaintenanceMode()
  // ^ Her sayfa isteğinde API'ye gider (cache: 60s in-memory)
}
```

**Analiz:**
- In-memory cache 60s TTL ile korunuyor ✅
- Ancak `AbortSignal.timeout(400)` ile her cache miss'te 400ms'ye kadar beklenebilir
- Next.js Edge Runtime'da `fetch` kullanılıyor → ISR cache kullanılamaz
- **Cold start** veya **cache expire** anında TTFB'ye +400ms eklenir

> **Öneri:**
> 1. **Build-time env variable:** `MAINTENANCE_MODE=true/false` → middleware'de API çağrısı yerine env check.
> 2. Veya **Rewrite/redirect** tabanlı: `next.config.mjs`'te `redirects()` async fonksiyonu ile build-time kontrol.
> 3. Minimum: `MAINTENANCE_CACHE_TTL_MS`'i `60_000` → `300_000` (5 dakika) yapın. Bakım modunu açıktan kapamak zaten nadir bir operasyon.

### Sorun 11 — Middleware'de `signal: AbortSignal.timeout()` kullanımı

```tsx
signal: AbortSignal.timeout(MAINTENANCE_TIMEOUT_MS),
```

`server-api-fallback.ts`'deki yorumda belirtildiği gibi:
> "Next.js Data Cache signal görünce revalidate kuralını yok sayıp **her istekte SSR** yapar."

Middleware'deki `next: { revalidate: 60 }` ile birlikte `signal` geçilmesi bu cache'i devre dışı bırakabilir.

> **Öneri:** `signal`'ı kaldırın ve `server-api-fallback.ts`'deki gibi `Promise.race` ile timeout uygulayın.

---

## 3. JavaScript Bundle Analizi

### 3.1 Ağır Bağımlılıklar

| Paket | Yaklaşık Boyut (gzip) | Kullanıldığı Yer | Sorun |
|-------|----------------------|-------------------|-------|
| `recharts` | ~180KB | Admin dashboard | `optimizePackageImports` var ✅ ama admin dışında leak olabilir |
| `dompurify` | ~20KB gzip | Blog detail | Statik import |
| `@radix-ui/*` (22 paket) | ~120KB toplam | Her yerde | Tree-shake yapılır ama çok fazla primitive |
| `embla-carousel-react` | ~15KB | Ürün galeri | Kabul edilebilir |
| `date-fns` | ~8KB (tree-shaked) | Admin, sipariş | ✅ |
| `react-day-picker` | ~25KB | Siparişler | Admin'de lazy-load edilmeli |
| `react-resizable-panels` | ~12KB | Admin | Admin'de lazy-load edilmeli |
| `zod` | ~15KB | Form validasyon | ✅ tree-shakes well |

### 3.2 Radix UI Aşırı Kullanım

22 ayrı `@radix-ui/react-*` paketi yüklü. Bunlardan bazıları **hiçbir kullanıcı sayfasında** kullanılmıyor:
- `react-menubar` → sadece admin?
- `react-context-menu` → kullanılıyor mu?
- `react-hover-card` → kullanılıyor mu?
- `react-navigation-menu` → Header'da yok, kullanılmıyor olabilir

> **Öneri:** Kullanılmayan primitifleri `package.json`'dan kaldırın. `npx depcheck` ile kontrol edin.

### 3.3 `product-detail.tsx` — Dynamic Import Kalıbı ✅

```tsx
const PurchaseDialog = dynamic(() => import("...").then(m => ({ default: m.PurchaseDialog })))
const ProductReviews = dynamic(() => import("...").then(m => ({ default: m.ProductReviews })))
const RelatedProducts = dynamic(() => import("...").then(m => ({ default: m.RelatedProducts })))
const WhatsAppButton = dynamic(() => import("...").then(m => ({ default: m.WhatsAppButton })))
```

Bu çok iyi bir kalıp — gereksiz JS initial bundle'dan çıkarılmış.

### 3.4 Bundle Analiz Komutu

```bash
ANALYZE=true pnpm build
```

`@next/bundle-analyzer` dev dependency olarak mevcut ama `next.config.mjs`'te **aktif değil**.

> **Öneri:** `next.config.mjs`'e ekleyin:
> ```js
> import withBundleAnalyzer from '@next/bundle-analyzer'
> const analyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })
> export default analyzer(nextConfig)
> ```

---

## 4. Hidrasyon ve Client Component Sınırları

### Sorun 12 — `Header` ve `Footer` Client Component (Orta Etki, Zor)

```tsx
// components/layout/header.tsx
"use client"  // TÜM HEADER client component
```

```tsx
// components/layout/footer.tsx  
"use client"  // TÜM FOOTER client component
```

Bu bileşenler `app/(main)/layout.tsx`'te render edilir → **her sayfanın** hidrasyon maliyetine eklenir.

**Header analizi:**
- `useAuth()` → AuthContext tüketir → `authApi.getProfile()` fetch
- `useCartWishlistCounts()` → `cartApi.getCart()` + `wishlistApi.getWishlist()` fetch
- Import zinciri: `lucide-react`, `useRouter`, `MobileMenu`, `HeaderSearch`, `HeaderActions`

**Footer analizi:**
- `useSiteSettings()` → context tüketir (data SSR'dan gelir ama bileşen hala hydrate olur)

> **Öneri — Header refactor:**
> ```
> // components/layout/header.tsx → Server Component
> export function Header() {
>   return (
>     <header>
>       <Link href="/">Can Antika</Link>
>       <nav>{navigation.map(...)}</nav>  {/* Server-rendered */}
>       <Suspense fallback={<HeaderActionsSkeleton />}>
>         <HeaderActionsClient />  {/* Sadece bu client */}
>       </Suspense>
>     </header>
>   )
> }
> ```
> Logo ve nav linkler statik HTML olur, sadece Authentication/Cart kısmı hydrate edilir.

> **Öneri — Footer refactor:**
> Footer'daki tek dinamik veri `useSiteSettings()`. Bu veri zaten `RootLayout`'ta SSR'da fetch ediliyor. Footer'ı server component yapıp settings'i prop olarak geçirin.

### Sorun 13 — `AuthProvider` hidrasyon waterfall

```tsx
// auth-context.tsx
useEffect(() => {
  if (!hasAuthSessionFlag()) {
    queueMicrotask(() => setIsLoading(false))
    return
  }
  authApi.getProfile().then(...)  // API call hidrasyon anında
}, [])
```

Bu `useEffect` **her sayfa yüklemesinde** çalışır. `hasAuthSessionFlag()` (sessionStorage check) ile optimize edilmiş ✅, ama session varsa hemen API call yapılır.

> **Öneri:** `getProfile()` isteğini `requestIdleCallback` ile geciktirin veya `stale-while-revalidate` stratejisi uygulayın (cached user data + background refresh).

---

## 5. Görüntü Stratejisi

### 5.1 Hero Image — LCP Element

```tsx
// hero-section.tsx
<Image
  src="/dükkan.webp"
  fill
  priority
  fetchPriority="high"
  sizes="100vw"
/>
```

```html
<!-- app/layout.tsx -->
<link rel="preload" href="/d%C3%BCkkan.webp" as="image" type="image/webp" fetchPriority="high" />
```

✅ `priority` + `fetchPriority="high"` + `<link rel="preload">` — üç katmanlı LCP optimizasyonu mevcut.

**Minor Sorun:** `Image` component'i `loader: "custom"` kullanıyor → `cloudinaryImageLoader` local dosyalar için no-op döner. Ancak `sizes="100vw"` ile `srcSet` çoklu boyutlar üretmez (custom loader local dosya için transformasyon yapmaz).

> **Öneri:** Hero image'ı `/public` yerine Cloudinary'ye yükleyin ve responsive boyutlar kullanın:
> ```tsx
> sizes="100vw"
> // Cloudinary loader otomatik olarak w_640, w_1024, w_1920 üretecektir
> ```

### 5.2 Cloudinary Loader

```ts
// cloudinary-image-loader.ts
export default function cloudinaryImageLoader({ src, width, quality }) {
  if (isCloudinaryImageUrl(src)) {
    return toCloudinaryResponsiveUrl(src, width, quality ?? "auto")
  }
  return src  // Fallback: transformasyon yok
}
```

✅ Cloudinary URL'leri için responsive dönüşüm yapılır. Local dosyalar olduğu gibi kalır.

### 5.3 Katalog ve Ürün Resimleri

```tsx
// new-arrivals.tsx
<Image loading="lazy" decoding="async" sizes="(max-width: 640px) 50vw, ..." />
```

✅ `lazy` loading + doğru `sizes` attribute'ü. Ancak:

- `related-products.tsx`: `loading="lazy"` ✅
- `product-card.tsx`: `isPriority` prop ile ilk 2 ürün `priority` ✅

> **Durum:** Görüntü stratejisi genel olarak iyi. Hero image Cloudinary'ye taşınması tek iyileştirme.

---

## 6. CSS ve Kritik Render Yolu

### 6.1 Mevcut Konfigürasyon

```js
// next.config.mjs
experimental: {
  cssChunking: "loose",   // ✅ Daha az CSS chunk, daha hızlı ilk paint
  optimizeCss: true,       // ✅ CSS minification (critters/lightningcss)
}
```

### 6.2 Tailwind CSS v4

```css
/* globals.css */
@import "tailwindcss";
```

Tailwind v4 `@tailwindcss/postcss` ile build-time CSS üretir. **JIT** engine ile kullanılmayan utility'ler elenir ✅.

### 6.3 Global CSS Boyutu

`globals.css` ≈ 536 satır:
- CSS custom properties (oklch tema) — ~120 satır
- `@theme inline` bloğu — ~60 satır
- Toast styles — ~30 satır
- Animations (ticker, sheet, accordion, mobile-menu) — ~200 satır
- Custom scrollbar — ~80 satır

> **Öneri:** Scrollbar ve animation CSS'lerini ayrı dosyalara taşıyıp sadece ihtiyaç duyulan sayfalarda import edin.

### 6.4 Font Stratejisi

```tsx
const _inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap", preload: true })
const _playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--font-playfair", display: "swap", preload: true })
```

✅ `display: "swap"` → FOUT gösterir, FOIT engelienir.  
✅ `preload: true` → CSS'den önce font yüklenir.  
✅ `latin-ext` → Türkçe karakterler (ğ, ş, ö, ç, ı, ü) desteklenir.

**Potansiyel Sorun:** İki font family preload etmek → 2 ayrı font request bloklanmaya neden olabilir.

> **Öneri (Düşük Etki):** `Playfair_Display`'i `preload: false` yapıp sadece `Inter`'ı preload edin. Serif font başlıklarda kullanılır ve genelde above-the-fold'da çok az yer kaplar. `display: "swap"` zaten FOIT'u engeller.

---

## 7. `server-api-fallback.ts` Derin Analiz

### 7.1 Mimari

```
fetchApiDataWithFallback(path, options)
  ├── lastWorkingBaseUrl varsa → tryFetch (max 700ms)
  ├── Başarısız olursa → Promise.any(tüm adaylar, timeoutMs)
  └── Hepsi başarısız → null
```

**Pozitifler:**
- ✅ `lastWorkingBaseUrl` → fast-path (module-level cache)
- ✅ `Promise.race` ile timeout (AbortSignal yok → ISR cache korunur)
- ✅ `Promise.any` ile paralel fallback

**Sorunlar:**

1. **`lastWorkingBaseUrl` module-level mutable state:** Serverless ortamda (Vercel gibi) her cold start'ta sıfırlanır. Docker standalone'da Node.js process uzun yaşar → sorun yok. Ama **race condition** riski var: iki eşzamanlı istek `lastWorkingBaseUrl`'i farklı değerlerle yazabilir.

2. **`null` dönüş — sessiz hata:** Tüm endpoint'ler başarısız olduğunda `null` döner. Çağıran kod genelde `products = data?.items ?? []` yapar → boş sayfa, hata mesajı yok.

> **Öneri:** 
> 1. `null` döndüğünde `console.warn` ekleyin (zaten yok).
> 2. Opsiyonel: Monitoring/alerting için bir counter tutun.

---

## 8. `api-client.ts` (İstemci-tarafı) Analizi

### 8.1 Timeout ve Retry

```tsx
const REQUEST_TIMEOUT_MS = 15000  // 15 saniye!
const REFRESH_TIMEOUT_MS = 8000
```

15 saniyelik timeout çok yüksek. Kullanıcı 15 saniye beklemez.

> **Öneri:** `REQUEST_TIMEOUT_MS = 8000`, `REFRESH_TIMEOUT_MS = 5000`.

### 8.2 URL Candidate Logic

```tsx
function getCandidateBaseUrls(): string[] {
  // ~60 satır karmaşık logic
  // production'da: canantika.com → https://api.canantika.com
  // development'da: localhost:8085, 127.0.0.1:8085, backend:8080
}
```

Bu fonksiyon **memoized** ✅ (`_cachedBaseUrls`). Ancak `isBrowser` check'i ile server/client'a göre farklı URL listesi üretir — bu doğru ama karmaşık.

### 8.3 CSRF Token Handling

```tsx
function attachCsrfHeader(headers, method) {
  if (CSRF_SAFE_METHODS.has(method)) return
  const csrfToken = readCookie(CSRF_COOKIE_NAME)
  if (csrfToken) headers[CSRF_HEADER_NAME] = csrfToken
}
```

✅ CSRF koruması mevcut. Safe methods'da skip edilir.

---

## 9. Core Web Vitals Tahmini

### 9.1 LCP (Largest Contentful Paint)

**LCP element:** Hero image (`/dükkan.webp`)

| Faktör | Durum | Etki |
|--------|-------|------|
| `<link rel="preload">` | ✅ | +Pozitif |
| `priority` + `fetchPriority="high"` | ✅ | +Pozitif |
| Local dosya (public/) | ⚠️ CDN'de değil | -150ms potansiyel |
| Font preload (2 font) | ⚠️ Bant genişliği yarışması | -50ms potansiyel |
| Middleware TTFB overhead | ⚠️ +400ms cold start | -400ms worst case |
| CSS chunk stratejisi | ✅ "loose" | +Pozitif |

**Tahmini LCP:** 1.8s–3.2s (ağ koşullarına bağlı)

### 9.2 CLS (Cumulative Layout Shift)

| Faktör | Durum |
|--------|-------|
| Font `display: swap` | ⚠️ Küçük shift olabilir (FOUT) |
| `CategoriesSection` client fetch | ⚠️ Skeleton → gerçek içerik |
| Image `fill` + `aspect-ratio` | ✅ Layout shift yok |
| Header sabit yükseklik | ✅ `h-16 / h-20` |

**Tahmini CLS:** 0.05–0.15 (`CategoriesSection` düzeltilirse <0.05)

### 9.3 INP (Interaction to Next Paint)

| Faktör | Durum |
|--------|-------|
| Katalog filtre değişikliği | ⚠️ `fetchTrigger` state → re-render + API call |
| Cart ekleme | ✅ Optimistic UI yok ama `addingToCart` state var |
| Navigation | ✅ Next.js prefetch + client-side routing |

**Tahmini INP:** 150ms–300ms

---

## 10. Acil Eylem Planı (Öncelik Sırasına Göre)

### Tier 1 — Yüksek Etki, Kolay (Bu Hafta)

| # | Aksiyon | Dosya | Beklenen İyileşme |
|---|---------|-------|-------------------|
| 1 | `DOMPurify` → dynamic import | `blog-detail-client.tsx` | Bundle: -20KB gzip |
| 2 | Catalog timeout `3500ms` → `1500ms` | `urunler/page.tsx` | TTFB: -2000ms worst case |
| 3 | Blog `size=50` → `size=12` | `blog/page.tsx` | TTFB: -200ms, payload: -80% |
| 4 | Middleware cache TTL `60s` → `300s` | `middleware.ts` | TTFB: -400ms (cache hit oranı ↑) |
| 5 | Related products `size: 12` → `size: 5` | `product-page-client.tsx` | Network: -60% payload |

### Tier 2 — Yüksek Etki, Orta Zorluk (Bu Ay)

| # | Aksiyon | Dosya | Beklenen İyileşme |
|---|---------|-------|-------------------|
| 6 | `CategoriesSection` → Server Component | `categories-section.tsx` | CLS: -0.1, LCP: -500ms |
| 7 | Middleware `signal` kaldır → `Promise.race` | `middleware.ts` | ISR cache düzgün çalışır |
| 8 | SSR catalog filters (URL params) | `urunler/page.tsx` | Gereksiz client re-fetch yok |
| 9 | Bundle analyzer aktif et | `next.config.mjs` | Visibility ↑ |
| 10 | Kullanılmayan Radix paketleri kaldır | `package.json` | Bundle: -10-30KB |

### Tier 3 — Orta Etki, Teknik Borç (Gelecek Sprint)

| # | Aksiyon | Dosya | Beklenen İyileşme |
|---|---------|-------|-------------------|
| 11 | Header → Server/Client split | `header.tsx` | Hidrasyon: -50KB JS |
| 12 | Footer → Server Component | `footer.tsx` | Hidrasyon: -15KB JS |
| 13 | Hero image → Cloudinary | `hero-section.tsx` | LCP: -200ms (CDN + responsive) |
| 14 | `Playfair_Display` preload: false | `layout.tsx` | Font loading: -1 request |
| 15 | `ignoreBuildErrors: true` kaldır | `next.config.mjs` | DX + güvenlik ↑ |
| 16 | `REQUEST_TIMEOUT_MS` 15s → 8s | `api-client.ts` | UX: daha hızlı hata gösterimi |

---

## 11. Monitoring ve Ölçüm Önerileri

### 11.1 Web Vitals Tracking

```tsx
// app/layout.tsx veya providers.tsx
import { onCLS, onLCP, onINP } from 'web-vitals'

function sendToAnalytics(metric) {
  // GA4 veya custom endpoint
  gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    non_interaction: true,
  })
}

onCLS(sendToAnalytics)
onLCP(sendToAnalytics)
onINP(sendToAnalytics)
```

### 11.2 Server Timing Headers

`server-api-fallback.ts`'e timing bilgisi ekleyin:
```tsx
const start = performance.now()
const result = await tryFetch(...)
const duration = performance.now() - start
// Server-Timing header ekle: "api;dur=45"
```

### 11.3 Bundle Budget

`package.json`'a size-limit ekleyin:
```json
{
  "size-limit": [
    { "path": ".next/static/chunks/**/*.js", "limit": "300 KB" }
  ]
}
```

---

## 12. Sonuç

Can Antika'nın frontend mimarisi genel olarak **iyi kurulmuş**: Suspense streaming, `cache()` dedup, `Promise.allSettled` paralel fetch, Cloudinary responsive images ve dynamic imports doğru şekilde kullanılıyor.

**En kritik 3 iyileştirme:**

1. **`CategoriesSection`'ı Server Component'e dönüştürmek** → CLS ve LCP'de en büyük kazanç
2. **Timeout'ları agresif şekilde düşürmek** (3500ms → 1500ms) → TTFB worst-case'i yarıya indirmek
3. **`DOMPurify` dynamic import** → Blog sayfalarının JS bundle'ını %25 küçültmek

Bu üç değişiklik tek başına **Lighthouse Performance skorunu 10-20 puan** artırabilir.

---

*Rapor Sonu — Performans izleme ve A/B testleri ile sonuçları doğrulamayı unutmayın.*
