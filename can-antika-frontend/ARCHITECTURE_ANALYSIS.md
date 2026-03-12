# Mimari Analiz Raporu — Can Antika Frontend

## KRİTİK SEVİYE (Yoğun sorumluluk yığılması)

---

### 1. `app/admin/page.tsx` — 411 satır

**Yığılan sorumluluklar:**
- 5 farklı `useState` veri kaynağı (`stats`, `recentOrders`, `exchangeRates`, `activityLogs`, `pendingTasks`)
- 2 ayrı `useEffect` ile 6+ API çağrısı + 1 harici API (`exchangerate-api.com`) çağrısı
- Grafik veri dönüşümü (mapping), tarih formatlama gibi iş mantığı
- Devasa inline JSX: kısayollar bölümü, döviz ticker'ı, bekleyen işler kartları, sipariş akışı, ciro özetleri, log timeline... tamamı tek component'te
- Inline CSS animasyon (`@keyframes ticker`)

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Stats + chart data fetching | `useAdminDashboardStats(chartRange)` custom hook |
| Exchange rate fetch + ticker | `<ExchangeRateTicker />` alt bileşeni |
| Pending tasks bölümü | `<PendingTasksGrid />` alt bileşeni |
| Sipariş akışı kartı | `<RecentOrderCard />` alt bileşeni |
| Ciro özetleri sidebar | `<RevenueSummary stats={stats} />` alt bileşeni |
| Activity log timeline | `<ActivityLogTimeline logs={activityLogs} />` alt bileşeni |
| Tarih formatlama | `lib/utils.ts` → `formatDateTR()` |

---

### 2. `components/product/product-detail.tsx` — 449 satır

**Yığılan sorumluluklar:**
- Sepete ekleme, favorilere ekleme, paylaşma → 3 ayrı async handler + 6+ state
- Sepet durumu kontrolü (`cartApi.getCart()` → useEffect)
- Attribute parsing (era, condition, dimensions, provenance, status)
- UI katmanları: Breadcrumb, ImageGallery, fiyat, stok gösterimi, quantity selector, CTA butonları, WhatsApp linki (inline SVG dahil), trust badges, Tabs (detaylar/hikaye/durum/yorumlar)
- `Header` ve `Footer` bu component içinde render ediliyor (page-level layout sorumluluğu bu component'e yüklenmiş)

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Cart/Wishlist/Share mantığı | `useProductActions(product, isAuthenticated)` custom hook |
| Attribute parsing | `getProductAttributes(product)` utility |
| WhatsApp butonu (SVG dahil) | `<WhatsAppButton product={product} />` alt bileşeni |
| Trust badges | `<TrustBadges />` alt bileşeni |
| Quantity selector | `<QuantitySelector max={maxStock} value={quantity} onChange={...} />` |
| CTA buton grubu | `<ProductCTAButtons />` alt bileşeni |
| Header/Footer çıkarılmalı | Layout sorumluluğu `app/urun/[slug]/page.tsx`'e taşınmalı |

---

### 3. `app/admin/ayarlar/page.tsx` — 516 satır

**Yığılan sorumluluklar:**
- Tek bir bileşen içinde 12 farklı tab panelinin JSX'i koşullu render ediliyor (store, company, contact, shipping, payment, currency, footer, social, seo, smtp, sms, maintenance)
- Her tab paneli inline olarak yazılmış, hiçbiri ayrı bileşen değil
- `Field`, `TextareaField`, `Toggle` yardımcı bileşenler dosya sonunda tanımlı ama tab panel'leri değil

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Her tab paneli | Ayrı bileşen: `<StoreSettingsTab />`, `<PaymentSettingsTab />`, `<SmtpSettingsTab />` vb. |
| Tab routing mantığı | Tab bileşen haritası: `const TAB_COMPONENTS: Record<string, FC>` |
| Field, TextareaField, Toggle | `components/ui/form-fields.tsx`'e taşınmalı (reusable) |

---

### 4. `app/siparis/page.tsx` — 409 satır

**Yığılan sorumluluklar:**
- Cart fetch + Address fetch → tek `useEffect` içinde `Promise.all`
- Kupon uygulama/kaldırma iş mantığı (apply/remove + indirim hesabı)
- Ödeme yöntemi state + `useSiteSettings()` ile dinamik ödeme seçenekleri oluşturma
- 3 ayrı koşullu render: loading / order placed / empty cart / checkout form
- Adres seçimi, ödeme yöntemi seçimi, sipariş notu, sipariş özeti paneli → tamamı tek component

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Cart + address fetching | `useCheckoutData()` custom hook |
| Kupon mantığı | `useCoupon(cartTotal)` custom hook |
| Adres seçim bloğu | `<AddressSelector addresses={...} selected={...} />` |
| Ödeme seçim bloğu | `<PaymentMethodSelector />` |
| Sipariş özeti sidebar'ı | `<OrderSummary cart={...} discount={...} />` |
| Sipariş onay ekranı | `<OrderConfirmation orderId={...} />` |

---

### 5. `app/hesap/siparisler/[id]/page.tsx` — 388 satır

**Yığılan sorumluluklar:**
- İçinde **tüm fatura HTML'i** string olarak `window.open` + `document.write` ile yazılıyor (~60 satır inline HTML+CSS)
- Kargo takip URL oluşturma mantığı (carrier → URL mapping) JSX render fonksiyonu içinde IIFE olarak gömülü
- Sipariş iptal etme, iade talebi oluşturma → dialog state'leri + handler'ları
- İade dialog bileşeni inline

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Fatura HTML oluşturma | `lib/invoice-template.ts` → `generateInvoiceHtml(invoice, settings)` utility |
| Kargo URL mapping | `lib/carrier-tracking.ts` → `getTrackingUrl(carrier, code)` utility |
| Kargo bilgileri kartı | `<TrackingInfoCard order={order} />` alt bileşeni |
| İade dialog | `<ReturnRequestDialog orderId={...} />` alt bileşeni |
| İptal butonu mantığı | `<CancelOrderButton />` alt bileşeni |

---

## ORTA SEVİYE

---

### 6. `components/header.tsx` — 387 satır

**Yığılan sorumluluklar:**
- Cart count + wishlist count fetch + window event listener (`cart-updated`, `wishlist-updated`)
- Debounced search (300ms) + search results render
- Kategori fetch
- Mobil menü (Sheet), arama overlay, kullanıcı durumuna göre 3 farklı action bar (admin / customer / visitor)

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Badge sayaçları | `useCartWishlistCounts()` custom hook |
| Arama mantığı + sonuçları | `<HeaderSearch />` alt bileşeni + `useProductSearch()` hook |
| Mobil menü sheet'i | `<MobileMenu />` alt bileşeni |
| Action bar (3 varyant) | `<HeaderActions />` alt bileşeni |

---

### 7. `app/urunler/catalog-client.tsx` — 369 satır

**Yığılan sorumluluklar:**
- Category fetch + URL param resolve
- Product search (5 parametre, pagination, sort)
- Filter state yönetimi
- Inline `VintageCorner` SVG bileşeni bu dosyada tanımlı (yeniden kullanılabilir olmalı)
- Mobil filtre Sheet UI

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Ürün arama + filtre | `useProductCatalog(searchParams)` custom hook |
| VintageCorner SVG | `components/ui/vintage-icons.tsx`'e taşınmalı (zaten orada bir versiyon var) |
| Mobil filtre sheet | `<MobileFilterSheet />` alt bileşeni |
| Sort + view controls | `<CatalogToolbar />` alt bileşeni |

---

### 8. `app/giris/page.tsx` — 422 satır

**Yığılan sorumluluklar:**
- Login form state + Register form state → 2 ayrı form objesinin tüm state'i tek component'te
- Login handler + Register handler
- Form animasyon yönetimi (`switchMode`, `isAnimating`)
- Dekoratif sol panel (Image, quote rotation) + sağ panel (formlar)
- Inline `<style>` tag'i (keyframes)

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Login formu | `<LoginForm onSuccess={...} />` alt bileşeni |
| Register formu | `<RegisterForm onSuccess={...} />` alt bileşeni |
| Dekoratif sol panel | `<AuthHeroPanel mode={mode} />` alt bileşeni |
| Animasyon CSS | `globals.css`'e taşınmalı |

---

### 9. `app/admin/siparisler/page.tsx` — 370 satır

**Yığılan sorumluluklar:**
- Sipariş listesi fetch + filtreleme (client-side)
- Durum güncelleme (5 farklı status transition)
- Tracking dialog state + handler
- Detail dialog state + handler
- 2 ayrı Dialog bileşeni inline render

**Refactoring planı:**

| Parça | Hedef |
|-------|-------|
| Sipariş verisi fetch + filter | `useOrderList(page)` custom hook |
| Kargo dialog | `<TrackingDialog order={...} onSave={...} />` alt bileşeni |
| Detay dialog | `<OrderDetailDialog order={...} />` alt bileşeni |
| Tablo satır action menu | `<OrderRowActions order={...} />` alt bileşeni |
| Status config + format date | Ortak `lib/order-utils.ts` |

---

### 10. `lib/api/index.ts` — 677 satır

**Sorun:** 20+ API modülü (auth, product, category, cart, order, wishlist, address, review, payment, stats, user, file, settings, notifications, activity-log, newsletter, faq, pages, reports, coupons, brands, blog, contact, bank-transfers, popups) tek dosyada.

**Refactoring planı:**

Domain bazlı dosyalara ayırma:

```
lib/api/
  index.ts          → re-export hub
  auth.ts
  product.ts
  cart.ts
  order.ts
  admin/
    stats.ts
    users.ts
    reports.ts
    ...
```

---

## DÜŞÜK SEVİYE (ama düzeltilmeli)

| Dosya | Sorun | Öneri |
|-------|-------|-------|
| `iletisim/contact-client.tsx` (305 satır) | 4 adet inline SVG icon bileşeni (~80 satır) dosya başında tanımlı | `components/ui/vintage-icons.tsx`'e taşı |
| `admin/kategoriler/page.tsx` (315 satır) | Create + Edit + Delete + product count fetch → tek component | Create dialog → `<CreateCategoryDialog />`, inline edit mantığı kabul edilebilir |
| `admin/urunler/[id]/duzenle/page.tsx` (311 satır) | Form state + image upload + submit → tek component | `useProductForm(productId)` hook + `<ImageUploader />` alt bileşeni |
| `components/footer.tsx` (378 satır) | Büyük ama çoğunlukla statik JSX, sorun değil | Kabul edilebilir |

---

## YATAY SORUNLAR (Cross-cutting)

### 1. Header/Footer Tekrarı
`ProductDetail`, `ContactClient`, `CatalogClient`, `CartPage`, `CheckoutPage` gibi bileşenler kendi içinde `<Header />` ve `<Footer />` render ediyor. Bunlar Next.js `layout.tsx` seviyesinde olmalı, her page component'i tekrar etmemeli.

### 2. Tarih Formatlama
`toLocaleDateString("tr-TR", ...)` en az 10 farklı dosyada inline tekrarlanıyor. → `formatDate(date, format)` utility.

### 3. Status Label/Config
`statusConfig`, `statusLabels` gibi obj'ler en az 3 farklı dosyada tekrar tanımlanmış → `lib/order-utils.ts` içinde tek yerde.

### 4. Cart Event Dispatching
`cartApi` ve `wishlistApi` içinde `window.dispatchEvent(new Event("cart-updated"))` paterni kullanılıyor, `Header`'da da dinleniyor. Bu çalışıyor ama bir Zustand/Jotai store ile replace edilirse daha temiz olur.

---

## ÖNCELİK SIRASI (düzeltme planı için)

1. **`admin/page.tsx`** — En çok sorumluluk yığılması
2. **`product-detail.tsx`** — Müşteri-facing, en çok etkileşim noktası
3. **`admin/ayarlar/page.tsx`** — 12 tab inline
4. **`siparis/page.tsx`** — Checkout akışı karmaşıklığı
5. **`hesap/siparisler/[id]/page.tsx`** — Inline fatura HTML
6. **`header.tsx`** — Tüm sayfalarda kullanılıyor
7. **`lib/api/index.ts`** — 677 satırlık tek dosya
8. Diğerleri
