# Mimari Analiz & Kapsamlı Audit Raporu — Can Antika Frontend

> **Son güncelleme:** 28 Mart 2026  
> **Toplam tespit:** 135+ sorun (3 CRITICAL · 23 HIGH · 16+ MEDIUM · 30+ LOW · 87 RESOLVED · 0 PARTIALLY FIXED)

---

## İÇİNDEKİLER

1. [Özet Tablo](#özet-tablo)
2. [CRITICAL — Güvenlik](#critical--güvenlik)
3. [HIGH — Performans](#high--performans)
4. [HIGH — SOLID / Kod Kalitesi](#high--solid--kod-kalitesi)
5. [MEDIUM — Hata Yönetimi](#medium--hata-yönetimi)
6. [MEDIUM — TypeScript](#medium--typescript)
7. [MEDIUM — Erişilebilirlik (Accessibility)](#medium--erişilebilirlik)
8. [MEDIUM — Kod Tekrarı](#medium--kod-tekrarı)
9. [MEDIUM — Eksik Suspense / Error Boundary](#medium--eksik-suspense--error-boundary)
10. [MEDIUM — SEO / Metadata](#medium--seo--metadata)
11. [MEDIUM — Race Condition / Async](#medium--race-condition--async)
12. [MEDIUM — Memory Leak](#medium--memory-leak)
13. [MEDIUM — Eksik Validasyon](#medium--eksik-validasyon)
14. [LOW — Hardcoded Değerler](#low--hardcoded-değerler)
15. [LOW — Unused / Gereksiz Kod](#low--unused--gereksiz-kod)
16. [LOW — Görsel Optimizasyon](#low--görsel-optimizasyon)
17. [LOW — Diğer](#low--diğer)
18. [ÇÖZÜLMÜŞ Sorunlar](#çözülmüş-sorunlar)
19. [KISMEN ÇÖZÜLMÜŞ Sorunlar](#kısmen-çözülmüş-sorunlar)
20. [Dosya Bazlı Refactoring Planları](#dosya-bazlı-refactoring-planları)
21. [Yatay Sorunlar (Cross-cutting)](#yatay-sorunlar-cross-cutting)
22. [Öncelik Sırası (Aksiyon Planı)](#öncelik-sırası-aksiyon-planı)

---

## ÖZET TABLO

| Kategori | Adet | Durum |
|----------|------|-------|
| **CRITICAL** | 3 | Derhal müdahale gerekli |
| **HIGH** | 23 | Production öncesi çözülmeli |
| **MEDIUM** | 16+ | Sonraki sprint'te planlanmalı |
| **LOW** | 30+ | İyileştirme, kozmetik |
| **RESOLVED** | 87 | ✅ Çözüldü |
| **PARTIALLY FIXED** | 0 | 🟡 Hepsi tamamlandı |

---

## CRITICAL — GÜVENLİK

### ✅ C-01. Invoice XSS — window.open() + document.write() — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/hesap/siparisler/[id]/page.tsx` · Satır ~61
- **Kategori:** Security / XSS
- **Durum:** ✅ **Phase 7'de çözüldü** — `window.open() + document.write()` yerine `Blob([html]) + URL.createObjectURL(blob)` yaklaşımına geçildi. `URL.revokeObjectURL` ile 10sn cleanup eklendi. Popup blocker tespiti + toast uyarısı eklendi.

---

### ✅ C-02. External API — Exchange Rate MITM Riski — ÇÖZÜLDÜ
- **Dosya:** `components/dashboard/exchange-rate-ticker.tsx` · Satır ~11
- **Kategori:** Security / Network
- **Durum:** ✅ **Phase 7'de çözüldü** — `sessionStorage` ile 5dk cache eklendi. `AbortController` ile cleanup, `!res.ok` kontrolü, hata durumunda `AlertCircle` icon + "Döviz verisi alınamadı" mesajı, `console.error` loglama eklendi.

---

### ✅ C-03. Bilgi Sızıntısı — Ham Error Message Gösterimi — ÇÖZÜLDÜ
- **Dosya:** Birden fazla dosya (`register-form.tsx`, `login-form.tsx`, `admin/giris/page.tsx`, `useProductActions.ts`, `product-reviews.tsx`)
- **Kategori:** Security / Information Disclosure
- **Durum:** ✅ **Phase 7'de çözüldü** — `getErrorMessage(error: unknown, fallback: string)` utility oluşturuldu (`lib/utils.ts`). Stack trace strip, 200 karakter limit. Tüm catch bloklarında kullanıma alındı. Admin giriş sayfasında hardcoded güvenli mesaj.

---

### C-04. IDOR — Ürün Erişiminde Yetki Kontrolü Eksik
- **Dosya:** `app/(main)/(alisveris)/urun/[slug]/product-page-client.tsx` · Satır 39-45
- **Kategori:** Security / IDOR
- **Sorun:** Ürün sayfası slug/ID ile erişiliyor ama draft/private ürünlere erişim kontrolü yok.
```tsx
const fetchProduct = async () => {
  if (numericId !== null) return productApi.getById(numericId, 5000)
  return productApi.getBySlug(slug, 5000)
}
```
- **Çözüm:** `published: true` kontrolü; draft ürünlerde yetki doğrulama.

---

### C-05. CSRF Eksik — Sipariş Oluşturma
- **Dosya:** `app/(main)/(alisveris)/siparis/page.tsx` · Satır 24-35
- **Kategori:** Security / CSRF
- **Sorun:** State-changing POST (sipariş oluşturma) explicit CSRF token olmadan çalışıyor.
```tsx
const handlePlaceOrder = async () => {
  const order = await orderApi.createOrder({...})
}
```
- **Çözüm:** API client'ta CSRF token gönderildiğini doğrula; backend CSRF middleware ekle.

---

### ✅ C-06. Input Validasyon Eksik — İletişim Formu — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(bilgi)/iletisim/contact-client.tsx` · Satır 39-48
- **Kategori:** Security / Missing Validation
- **Durum:** ✅ **Phase 7'de çözüldü** — `maxLength` eklendi: name(100), email(254), phone(20), message(2000). Telefon `pattern="[0-9\s\+\-\(\)]{7,20}"` eklendi. Dekoratif görsele `role="presentation"` eklendi.

---

### ✅ C-07. Input Validasyon Eksik — Ürün Formu (Admin) — ÇÖZÜLDÜ
- **Dosya:** `components/admin/product-form.tsx` · Satır 72-88
- **Kategori:** Security / Missing Validation
- **Durum:** ✅ **Phase 7'de çözüldü** — `maxLength` eklendi: title(255), description(5000), story(5000).

---

### C-08. Adres Sahiplik Doğrulaması Eksik — Checkout
- **Dosya:** `app/(main)/(alisveris)/siparis/page.tsx` · Satır 17-25
- **Kategori:** Security / IDOR
- **Sorun:** Seçilen adresin mevcut kullanıcıya ait olup olmadığı kontrol edilmiyor (sadece UI state'e güveniliyor).
```tsx
const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
// handlePlaceOrder null kontrolü yapıyor ama sahiplik doğrulaması yok
```
- **Çözüm:** Backend'de `addressId` → authenticated user sahiplik kontrolü.

---

## HIGH — PERFORMANS

### ✅ H-01. İlişkili Ürünlerde Gereksiz İkinci API Çağrısı — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/urun/[slug]/product-page-client.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — `Promise.all` kaldırıldı; fallback (getAll) yalnızca kategori sonuçları <4 ise lazy olarak çağrılıyor.

---

### ✅ H-02. ExchangeRateTicker — Inline CSS Animasyon — ÇÖZÜLDÜ
- **Dosya:** `components/dashboard/exchange-rate-ticker.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — Inline `<style>` tag kaldırıldı; keyframes zaten `globals.css`'te mevcut.

---

### ✅ H-03. useCallback Eksik — ProductDetail Handler'ları — ÇÖZÜLDÜ
- **Dosya:** `hooks/useProductActions.ts`
- **Kategori:** Performance
- **Durum:** ✅ **Phase 7'de çözüldü** — `handleAddToCart`, `handleAddToWishlist`, `handleShare` handler'ları `useCallback` ile sarmalandı.

---

### ✅ H-04. React.memo Eksik — ActivityLogTimeline — ÇÖZÜLDÜ
- **Dosya:** `components/dashboard/activity-log-timeline.tsx`
- **Kategori:** Performance
- **Durum:** ✅ **Phase 7'de çözüldü** — Component `memo()` ile sarmalandı.

---

### ✅ H-05. Suspense / Loading — Checkout Sayfası — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/siparis/page.tsx`
- **Durum:** ✅ **Zaten uygulanmış** — `useCheckoutData` hook'u `isLoading` state döndürüyor; CheckoutContent loading spinner gösteriyor.

---

### ✅ H-06. Blog Arama Debounce Eksik — ÇÖZÜLDÜ
- **Dosya:** `components/home/blog-posts-client.tsx`
- **Kategori:** Performance
- **Durum:** ✅ **Phase 7'de çözüldü** — 300ms debounce state eklendi; `filteredPosts` `useMemo` ile memoize edildi.

---

### ✅ H-07. Cart Event Global Dispatch — ÇÖZÜLDÜ
- **Dosya:** `lib/commerce/guest-cart.ts`, `hooks/useCart.ts`
- **Durum:** ✅ **Phase 7'de çözüldü** — `useCart` hook'una `"cart-updated"` event listener eklendi; cross-tab `"storage"` event ile senkronize edildi. Zustand refactorü gereksiz — mevcut pattern event-driven ve sadece guest cart kullanıcılarında aktif.

---

### ✅ H-08. ProductForm Code-Split — ÇÖZÜLDÜ
- **Dosya:** `app/admin/(katalog)/urunler/yeni/page.tsx`, `[id]/duzenle/page.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — `next/dynamic` ile lazy load eklendi; loading spinner ile code-split.

---

## HIGH — SOLID / KOD KALİTESİ

### ✅ S-01. SRP — admin/page.tsx — ÇÖZÜLDÜ
- **Dosya:** `app/admin/page.tsx` (212 satır)
- **Durum:** ✅ **Phase 7'de çözüldü** — `useAdminDashboardStats()` hook'a taşındı; `ExchangeRateTicker`, `ActivityLogTimeline`, `RevenueChart` ayrı bileşenlere çıkarıldı; `CHART_RANGES` sabitlere taşındı. 411→212 satır.

---

### ✅ S-02. SRP — product-detail.tsx — ÇÖZÜLDÜ
- **Dosya:** `components/product/product-detail.tsx` (272 satır)
- **Durum:** ✅ **Çözüldü** — `useProductActions()` hook, `RelatedProducts`, `ImageGallery`, `ProductReviews` ayrı bileşenlere çıkarıldı. 449→272 satır. Kalan JSX tab panelleri için kabul edilebilir.

---

### ✅ S-03. SRP — admin/ayarlar/page.tsx — ÇÖZÜLDÜ
- **Dosya:** `app/admin/(sistem)/ayarlar/page.tsx` (305 satır)
- **Durum:** ✅ **Çözüldü** — 12 tab paneli `TAB_COMPONENTS` registry üzerinden dinamik yükleniyor; her tab ayrı bileşen dosyasında (`components/admin/settings/` altında). Ana sayfa sadece routing/layout. 516→305 satır.

---

### ✅ S-04. SRP — siparis/page.tsx — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/siparis/page.tsx` (142 satır)
- **Durum:** ✅ **Çözüldü** — `useCheckoutData()` + `useCoupon()` hook'larına taşındı; `AddressSelector`, `PaymentMethodSelector`, `OrderSummary`, `OrderConfirmation` ayrı bileşen dosyalarında. 409→142 satır.

---

### ✅ S-05. SRP — hesap/siparisler/[id]/page.tsx — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/hesap/siparisler/[id]/page.tsx` (180 satır)
- **Durum:** ✅ **Çözüldü** — `<TrackingInfoCard />`, `<ReturnRequestDialog />`, `<CancelOrderButton />` ayrı bileşenlere çıkarıldı; `generateInvoiceHtml()` + `getTrackingUrl()` utility'lere taşındı. 388→180 satır.

---

### ✅ S-06. SRP — header.tsx — ÇÖZÜLDÜ
- **Dosya:** `components/layout/header.tsx` (90 satır)
- **Durum:** ✅ **Çözüldü** — `useCartWishlistCounts()`, `useProductSearch()` hook'ları çıkarıldı; `<HeaderSearch />`, `<HeaderActions />`, `<MobileMenu />` ayrı bileşenlere taşındı. 387→90 satır.

---

### ✅ S-07. SRP — catalog-client.tsx — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/urunler/catalog-client.tsx` (284 satır)
- **Durum:** ✅ **Çözüldü** — `useCatalogFilters()` hook, `FilterSidebar`, `ActiveFilters`, `ProductCard` ayrı bileşenlere çıkarıldı. 369→284 satır. Kalan JSX layout/grid için kabul edilebilir.

---

### ✅ S-08. useState Yığılması — Admin Siparisler — ÇÖZÜLDÜ
- **Dosya:** `app/admin/(siparisler)/siparisler/page.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — Tracking dialog state'i (5 useState) tek obje state'ine konsolide edildi: `{ open, order, trackingNumber, carrierName, isSaving }`.

---

### ✅ S-09. useState — Kuponlar Sayfası — KABUL EDİLEBİLİR
- **Dosya:** `app/admin/(siparisler)/kuponlar/page.tsx`
- **Durum:** ✅ **Zaten kabul edilebilir** — 4 useState + 1 form obje state (8 alanlı). ~310 satır, makul boyutta.

---

### ✅ S-10. Prop Drilling — Checkout Akışı — KABUL EDİLEBİLİR
- **Dosya:** `app/(main)/(alisveris)/siparis/page.tsx` (142 satır)
- **Durum:** ✅ **Zaten kabul edilebilir** — `useCheckoutData()` + `useCoupon()` hook'ları state'i yönetiyor; prop geçişi sadece 1 seviye derinliğinde. Context gereksiz.

---

### S-11. lib/api/index.ts — 677 satır
- **Dosya:** `lib/api/index.ts`
- **Sorun:** 20+ API modülü tek dosyada.
- **Durum:** ✅ ÇÖZÜLDÜ — Domain bazlı dosyalara ayrıldı (`commerce/`, `catalog/`, `user/`, `content/`, `admin/`).

---

## MEDIUM — HATA YÖNETİMİ

### ✅ E-01. Sessiz Hata — Site Settings Context — ÇÖZÜLDÜ
- **Dosya:** `lib/site-settings-context.tsx` · Satır ~86
- **Durum:** ✅ **Phase 7'de çözüldü** — `console.error("Site ayarları yüklenemedi:", e)` eklendi.

---

### ✅ E-02. Sessiz Hata — ExchangeRateTicker — ÇÖZÜLDÜ
- **Dosya:** `components/dashboard/exchange-rate-ticker.tsx` · Satır ~30
- **Durum:** ✅ **Phase 7'de çözüldü** — C-02 kapsamında hata durumunda UI mesajı + console.error eklendi.

---

### ✅ E-03. Sessiz Hata — Cart Loading — ÇÖZÜLDÜ
- **Dosya:** `hooks/useCart.ts`
- **Durum:** ✅ **Phase 7'de çözüldü** — `.catch(() => setCart(null))` → `.catch((err) => { console.error("Sepet yüklenemedi:", err); setCart(null) })` olarak güncellendi.

---

### ✅ E-04. Sessiz Hata — Product Reviews — ÇÖZÜLDÜ
- **Dosya:** `components/product/product-reviews.tsx` · Satır ~33
- **Durum:** ✅ **Phase 7'de çözüldü** — `console.error("Yorumlar yüklenemedi:", e)` eklendi.

---

### ✅ E-05. Sessiz Hata — İletişim Talepleri (Admin) — ÇÖZÜLDÜ
- **Dosya:** `app/admin/(kullanicilar)/iletisim-talepleri/page.tsx` · Satır ~38
- **Durum:** ✅ **Phase 7'de çözüldü** — `console.error("Okundu işaretlenemedi:", e)` eklendi.

---

### ✅ E-06. Date Parse Hatası — ActivityLogTimeline — ÇÖZÜLDÜ
- **Dosya:** `components/dashboard/activity-log-timeline.tsx` · Satır ~24
- **Durum:** ✅ **Phase 7'de çözüldü** — Date parsing etrafına try-catch eklendi; parse hatasında "—" gösteriliyor.

---

### ✅ E-07. Error Boundary — Root Layout — ÇÖZÜLDÜ
- **Dosya:** `app/error.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — Boş `useEffect` → `console.error("Yakalanmamış hata:", error)` eklendi.

---

### ✅ E-08. Error Boundary Eksik — Product Detail — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/urun/[slug]/`
- **Durum:** ✅ **Phase 7'de çözüldü** — `[slug]/error.tsx` oluşturuldu. "Tekrar Dene" + "Ürünlere Dön" butonları.

---

### ✅ E-09. Error Boundary Eksik — Checkout — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/siparis/`
- **Durum:** ✅ **Phase 7'de çözüldü** — `siparis/error.tsx` oluşturuldu. "Tekrar Dene" + "Sepete Dön" butonları.

---

### ✅ E-10. Error Boundary Eksik — Admin Genel — ÇÖZÜLDÜ
- **Dosya:** `app/admin/`
- **Durum:** ✅ **Phase 7'de çözüldü** — `app/admin/error.tsx` oluşturuldu. "Tekrar Dene" + "Dashboard" butonları.

---

## MEDIUM — TYPESCRIPT

### ✅ T-01. `any` Tipi — ActivityLogTimeline — ÇÖZÜLDÜ
- **Dosya:** `components/dashboard/activity-log-timeline.tsx` · Satır 6
- **Durum:** ✅ **Phase 7'de çözüldü** — `any[]` → `ActivityLogResponse` (`lib/types.ts`'den import). Props ve useState tip güvenli.

---

### ✅ T-02. Unsafe Type Assertion — Raporlar Sayfası — ÇÖZÜLDÜ
- **Dosya:** `app/admin/(sistem)/raporlar/page.tsx`, `lib/types.ts`, `lib/api/admin/reports.ts`
- **Durum:** ✅ **Phase 7'de çözüldü** — `ReportData` interface oluşturuldu; `RevenueReport`, `CustomerReport` tipleri eklendi; tüm `as any[]` ve `: any` kaldırıldı.

---

### ✅ T-03. Error Tipi Eksik — useProductActions Hook — ÇÖZÜLDÜ
- **Dosya:** `hooks/useProductActions.ts` · Satır ~47
- **Durum:** ✅ **Phase 7'de çözüldü** — `getErrorMessage(err, fallback)` ile güvenli hata işleme.

---

### ✅ T-04. Loose Typing — ContactClient Form Data — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(bilgi)/iletisim/contact-client.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — `form.get("name") as string` → `(form.get("name") ?? "").toString().trim()` + zorunlu alan kontrolü eklendi.

---

### ✅ T-05. Error Typing Tutarsızlığı — Genel — ÇÖZÜLDÜ
- **Dosya:** register-form.tsx, login-form.tsx, birden fazla catch bloğu
- **Durum:** ✅ **Phase 7'de çözüldü** — `getErrorMessage(error: unknown, fallback: string)` utility oluşturuldu ve tüm ilgili catch bloklarında kullanıma alındı.

---

## MEDIUM — ERİŞİLEBİLİRLİK

### ✅ A-01. Alt Text Eksik — Terk Edilen Sepetler (Admin) — ÇÖZÜLDÜ
- **Dosya:** `app/admin/(siparisler)/terk-edilen-sepetler/page.tsx` · Satır ~89
- **Durum:** ✅ **Phase 7'de çözüldü** — `alt=""` → `alt={item.productTitle || "Ürün"}`.

---

### ✅ A-02. Alt Text Eksik — İletişim Arka Plan Görseli — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(bilgi)/iletisim/contact-client.tsx` · Satır ~129
- **Durum:** ✅ **Phase 7'de çözüldü** — Dekoratif görsele `role="presentation"` eklendi.

---

### ✅ A-03. Alt Text Eksik — Blog Admin Tablo — ÇÖZÜLDÜ
- **Dosya:** `app/admin/(icerik)/blog/page.tsx` · Satır ~123
- **Durum:** ✅ **Phase 7'de çözüldü** — `alt=""` → `alt={p.title}`.

---

### ✅ A-04. Aria Label Eksik — Icon Butonlar — ÇÖZÜLDÜ (kısmen)
- **Dosya:** `components/product/image-gallery.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — Image gallery navigasyon butonlarına `aria-label="Önceki görsel"` / `aria-label="Sonraki görsel"` eklendi (4 buton).
- **Not:** Diğer dosyalardaki icon butonlar backlog'da.

---

### ✅ A-05. Focus Yönetimi Eksik — Dialog'lar — ÇÖZÜLDÜ
- **Dosya:** `components/product/product-dialogs.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — PurchaseDialog ve ContactDialog'da ilk input'a `autoFocus` eklendi.

---

## MEDIUM — KOD TEKRARI

### ✅ D-01. Tarih Formatlama Tekrarı — ÇÖZÜLDÜ
- **Dosya:** `lib/utils.ts`, `activity-log-timeline.tsx`, `yorumlar/page.tsx`, `havale/page.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — `formatDateTR`'ye `"time"` formatı eklendi; inline `toLocaleString`/`toLocaleTimeString` kullanımları `formatDateTR()` ile değiştirildi.

---

### ✅ D-02. Status Config Tekrarı — Sipariş Admin — ÇÖZÜLDÜ
- **Dosya:** `siparisler/page.tsx`, `iadeler/page.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — Hardcoded `<SelectItem>` etiketleri `orderStatusConfig`/`returnStatusConfig`'den dinamik üretilmeye geçirildi.

---

### ✅ D-03. Error Message Paterni Tekrarı — ÇÖZÜLDÜ
- **Dosya:** 10+ dosya
- **Durum:** ✅ **Phase 7'de çözüldü** — `getErrorMessage(error: unknown, fallback: string)` utility oluşturuldu (`lib/utils.ts`). Tüm ilgili catch bloklarında kullanıma alındı.

---

### ✅ D-04. Promise.all Paterni — KABUL EDİLEBİLİR
- **Dosya:** Çeşitli
- **Durum:** ✅ **Zaten kabul edilebilir** — Her `Promise.all` kullanımı farklı API kombinasyonları için; ortak bir `batchFetch()` soyutlaması kodun okunabilirliğini azaltır.

---

## MEDIUM — EKSİK SUSPENSE / ERROR BOUNDARY

### ✅ SE-01. Suspense — ProductDetail Sayfası — ÇÖZÜLDÜ
- **Dosya:** `product-page-client.tsx`
- **Durum:** ✅ **Zaten uygulanmış** — `isCancelled` flag ile async fetch; `relatedProducts` boş array ile başlatılıyor, doğal loading pattern. Client component'te Suspense uygulanamaz.

---

### ✅ SE-02. Suspense — Checkout Sayfası — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/siparis/page.tsx`
- **Durum:** ✅ **Zaten uygulanmış** — `useCheckoutData` hook'u `isLoading` state döndürüyor; `CheckoutContent` spinner gösteriyor. Client component'te Suspense uygulanamaz.

---

### ✅ SE-03. Error Boundary Eksik — `[slug]` Ürün Route — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/urun/[slug]/`
- **Durum:** ✅ **Phase 7'de çözüldü** — `error.tsx` oluşturuldu (E-08 ile aynı).

---

### ✅ SE-04. Error Boundary Eksik — Sipariş Route — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/siparis/`
- **Durum:** ✅ **Phase 7'de çözüldü** — `error.tsx` oluşturuldu (E-09 ile aynı).

---

### ✅ SE-05. Error Boundary Eksik — Admin Root — ÇÖZÜLDÜ
- **Dosya:** `app/admin/`
- **Durum:** ✅ **Phase 7'de çözüldü** — `error.tsx` oluşturuldu (E-10 ile aynı).

---

## MEDIUM — SEO / METADATA

### ✅ SEO-01. Metadata — Yasal Sayfalar — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(yasal)/*/page.tsx`
- **Durum:** ✅ **Zaten uygulanmış** — Tüm 7 yasal sayfa (KVKK, gizlilik, iade, kullanım koşulları, çerezler, mesafeli satış, teslimat) `export const metadata` içeriyor.

---

### ✅ SEO-02. Structured Data — Ürün Sayfası — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(alisveris)/urun/[slug]/page.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — JSON-LD Product schema eklendi: name, description, image, offers (price, currency, availability), aggregateRating (koşullu).

---

### ✅ SEO-03. Canonical Tag — Admin Sayfaları — KABUL EDİLEBİLİR
- **Dosya:** Admin sayfaları
- **Durum:** ✅ **Zaten kabul edilebilir** — Admin sayfaları auth-guarded; public indexlenmediğinden canonical tag gereksiz.

---

## MEDIUM — RACE CONDITION / ASYNC

### ✅ R-01. Cart State Cross-Tab Senkronizasyon — ÇÖZÜLDÜ
- **Dosya:** `hooks/useCart.ts`
- **Durum:** ✅ **Phase 7'de çözüldü** — `"storage"` event listener ile cross-tab sync; `"cart-updated"` custom event listener ile aynı-tab sync eklendi.

---

### ✅ R-02. Cart + Auth Race Condition — ÇÖZÜLDÜ
- **Dosya:** `lib/auth/auth-context.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — `logout()` fonksiyonuna `guestCart.clear()` eklendi; logout sonrası eski sepet verileri temizleniyor.

---

### R-03. Product ilişkili Ürünleri — isCancelled Flag ✅
- **Dosya:** `app/(main)/(alisveris)/urun/[slug]/product-page-client.tsx` · Satır 82-102
- **Durum:** ✅ GOOD — `isCancelled` flag doğru kullanılmış.

---

## MEDIUM — MEMORY LEAK

### ✅ M-01. Unmounted State Update — ExchangeRateTicker — ÇÖZÜLDÜ
- **Dosya:** `components/dashboard/exchange-rate-ticker.tsx` · Satır 10-30
- **Durum:** ✅ **Phase 7'de çözüldü** — `AbortController` ile cleanup eklendi.

---

### ✅ M-02. Unmounted State Update — useProductActions — ÇÖZÜLDÜ
- **Dosya:** `hooks/useProductActions.ts` · Satır 27-37
- **Durum:** ✅ **Phase 7'de çözüldü** — `let cancelled = false` flag + `return () => { cancelled = true }` cleanup eklendi. Tüm setState çağrıları `if (cancelled) return` ile korunuyor.

---

## MEDIUM — EKSİK VALİDASYON

### ✅ V-01. Max Length Eksik — Yorum/İnceleme — ÇÖZÜLDÜ
- **Dosya:** `components/product/product-reviews.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — `maxLength={1000}` eklendi.

---

### ✅ V-02. Stok Doğrulaması — Sepet Güncelleme — ÇÖZÜLDÜ
- **Dosya:** `hooks/useCart.ts`
- **Durum:** ✅ **Phase 7'de çözüldü** — `handleUpdateQuantity`'ye client-side stok kontrolü eklendi: `if (maxStock != null && newQuantity > maxStock) toast.error(...)`

---

## LOW — HARDCODED DEĞERLER

### ✅ HC-01. Rate Limit Süresi — KABUL EDİLEBİLİR
- **Dosya:** `app/(main)/(bilgi)/iletisim/contact-client.tsx`
- **Durum:** ✅ **Zaten kabul edilebilir** — `RATE_LIMIT_MS = 60_000` sabiti client-side UX koruması olarak doğru; backend rate limiting ayrıca `X-RateLimit-Subject` header ile uygulanıyor.

---

### ✅ HC-02. Kargo Şirketleri Listesi — ÇÖZÜLDÜ
- **Dosya:** `lib/constants.ts`, `app/admin/(siparisler)/siparisler/page.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — `CARRIERS` sabiti `lib/constants.ts`'te merkezileştirildi.

---

### ✅ HC-03. Pagination Sayfa Boyutu — ÇÖZÜLDÜ
- **Dosya:** `lib/constants.ts` (yeni), `urunler/page.tsx`, `siparisler/page.tsx`, `useCatalogFilters.ts`
- **Durum:** ✅ **Phase 7'de çözüldü** — `ADMIN_PAGE_SIZE` ve `CATALOG_PAGE_SIZE` sabitleri `lib/constants.ts`'te merkezileştirildi.

---

### ✅ HC-04. Chart Tarih Aralıkları — ÇÖZÜLDÜ
- **Dosya:** `lib/constants.ts`, `app/admin/page.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — `CHART_RANGES` sabiti `lib/constants.ts`'te merkezileştirildi; admin dashboard'da import edildi.

---

### ✅ HC-05. Malzeme Listesi — Ürün Formu — ÇÖZÜLDÜ
- **Dosya:** `lib/product/products.ts`, `components/admin/product-form.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — `materials` listesi `lib/product/products.ts`'te harici dosyaya taşınmış.

---

## LOW — UNUSED / GEREKSİZ KOD

### ✅ U-01. Unused Imports — ÇÖZÜLDÜ
- **Durum:** ✅ **Phase 7'de doğrulandı** — ESLint kontrolü yapıldı; kullanılmayan import bulunamadı.

---

### ✅ U-02. Empty State Mesajları — İyileştirme — ÇÖZÜLDÜ
- **Dosya:** `components/dashboard/activity-log-timeline.tsx` · Satır ~26
- **Durum:** ✅ **Phase 7'de çözüldü** — "Kayıt bulunamadı" → "Henüz etkinlik kaydı yok." olarak güncellendi.

---

### ✅ U-03. Blog Arama Empty State — ÇÖZÜLDÜ
- **Dosya:** `components/home/blog-posts-client.tsx`
- **Durum:** ✅ **Zaten uygulanmış** — `searchTerm` kontrolüne göre "Arama kriterlerinize uygun yazı bulunamadı" vs "Blog yazıları yakında eklenecektir" ayrımı mevcut.

---

## LOW — GÖRSEL OPTİMİZASYON

### ✅ I-01. Hero Image — Sizes Prop — ÇÖZÜLDÜ
- **Dosya:** `components/home/hero-section.tsx`
- **Durum:** ✅ **Zaten uygulanmış** — `sizes="100vw"` mevcut.

---

### ✅ I-02. Admin Tablo Görselleri — ÇÖZÜLDÜ
- **Dosya:** Çeşitli admin sayfaları
- **Durum:** ✅ **Zaten uygulanmış** — Tüm admin tablo görselleri `sizes` prop'una sahip (ör: `sizes="48px"`).

---

## LOW — DİĞER

### ✅ O-01. Inline `<style>` Tag — AuthPage — ÇÖZÜLDÜ
- **Dosya:** `app/(main)/(auth)/giris/page.tsx` → `app/globals.css`
- **Durum:** ✅ **Phase 7'de çözüldü** — `@keyframes fadeSlideUp` inline `<style>` tag'inden `globals.css`'e taşındı.

---

### O-02. Footer Büyük Ama Kabul Edilebilir
- **Dosya:** `components/layout/footer.tsx` (378 satır)
- **Sorun:** Büyük ama çoğunlukla statik JSX; kritik değil.
- **Durum:** Kabul edilebilir.

---

### ✅ O-03. Admin Kategoriler — ÇÖZÜLDÜ
- **Dosya:** `app/admin/(katalog)/kategoriler/page.tsx`
- **Durum:** ✅ **Phase 7'de çözüldü** — Create form (5 useState) ve edit form (6 useState) ayrı obje state'lerine konsolide edildi: `createForm{ name, desc, coverImageUrl, isSaving, isUploading }` ve `editForm{ id, name, desc, coverImageUrl, isSaving, isUploading }`. 12→5 useState.

---

### ✅ O-04. Admin Ürün Düzenleme — KABUL EDİLEBİLİR
- **Dosya:** `app/admin/(katalog)/urunler/[id]/duzenle/page.tsx`
- **Durum:** ✅ **Zaten kabul edilebilir** — Form state `ProductForm` bileşeninde yönetiliyor; sayfa sadece veri fetch + wrapper. `next/dynamic` ile code-split uygulandı.

---

---

## ÇÖZÜLMÜŞ SORUNLAR

| # | Sorun | Dosya | Çözüm |
|---|-------|-------|-------|
| ✅ 1 | SRP ihlali — giris/page.tsx 437 satır | `giris/page.tsx` | Orchestrator'a dönüştürüldü (150 satır) + `LoginForm` + `RegisterForm` çıkarıldı |
| ✅ 2 | Kod tekrarı — kayit/page.tsx 239 satır | `kayit/page.tsx` | Paylaşımlı `RegisterForm` kullanılıyor (62 satır) |
| ✅ 3 | N+1 waterfall — İlişkili ürünler | `product-page-client.tsx` | `Promise.all()` ile paralel çağrı |
| ✅ 4 | Hook extraction — Adresler | `hesap/adresler/page.tsx` | `useAddresses()` hook çıkarıldı |
| ✅ 5 | Hook extraction — Destek talepleri | `hesap/destek/page.tsx` | `useSupportTickets()` hook çıkarıldı |
| ✅ 6 | Hook extraction — Favoriler | `hesap/favoriler/page.tsx` | `useFavorites()` hook çıkarıldı |
| ✅ 7 | Suspense eksik — Ana sayfa | `app/(main)/page.tsx` | HeroSection, NewArrivals, CategoriesSection, FeaturedStory sarmalandı |
| ✅ 8 | Open redirect — giris sayfası | `giris/page.tsx` | `getSafeRedirect()` fonksiyonu: decode control + regex whitelist |
| ✅ 9 | Rate limit eksik — İletişim formu | `contact-client.tsx` | `sessionStorage` tabanlı 60sn cooldown eklendi |
| ✅ 10 | Raw error exposure — Hesap sayfası | `hesap/page.tsx` | `error.message` → sabit Türkçe mesajlar |
| ✅ 11 | lib/api/index.ts 677 satır | `lib/api/` | Domain bazlı alt klasörlere ayrıldı (commerce, catalog, user, content, admin) |
| ✅ 12 | C-01: Invoice XSS | `hesap/siparisler/[id]/page.tsx` | `Blob + URL.createObjectURL` yaklaşımına geçildi |
| ✅ 13 | C-02: ExchangeRate caching + error | `exchange-rate-ticker.tsx` | sessionStorage 5dk cache, AbortController, error UI |
| ✅ 14 | C-03: Bilgi sızıntısı — error messages | Birçok dosya | `getErrorMessage()` utility oluşturuldu |
| ✅ 15 | C-06: İletişim formu validasyon | `contact-client.tsx` | maxLength + phone pattern eklendi |
| ✅ 16 | C-07: Ürün formu validasyon | `product-form.tsx` | title/description/story maxLength eklendi |
| ✅ 17 | T-01: ActivityLog any tipi | `activity-log-timeline.tsx` | `ActivityLogResponse` import edildi |
| ✅ 18 | T-03: useProductActions error tipi | `useProductActions.ts` | `getErrorMessage` ile güvenli hata |
| ✅ 19 | T-05: Error typing tutarsızlığı | 5+ dosya | `getErrorMessage` utility standardize etti |
| ✅ 20 | E-01~E-06: Sessiz hata logları | 5 dosya | `console.error` eklendi |
| ✅ 21 | E-08~E-10 / SE-03~SE-05: Error boundary'ler | 3 yeni dosya | Ürün, sipariş, admin error.tsx |
| ✅ 22 | A-01~A-03: Alt text düzeltmeleri | 3 dosya | Boş alt → anlamlı alt text |
| ✅ 23 | M-01~M-02: Memory leak | 2 dosya | AbortController + cancellation flag |
| ✅ 24 | D-03: Error message tekrarı | `lib/utils.ts` | `getErrorMessage()` utility |
| ✅ 25 | V-01: Yorum maxLength | `product-reviews.tsx` | `maxLength={1000}` eklendi |
| ✅ 26 | U-02: Empty state mesajları | `activity-log-timeline.tsx` | "Henüz etkinlik kaydı yok" |
| ✅ 27 | Y-05: Error message pattern | cross-cutting | `getErrorMessage()` ile çözüldü |
| ✅ 28 | H-06: Blog arama debounce | `blog-posts-client.tsx` | 300ms debounce + `useMemo` memoize |
| ✅ 29 | H-03: useCallback ProductActions | `useProductActions.ts` | 3 handler `useCallback` ile sarmalandı |
| ✅ 30 | H-04: React.memo ActivityLog | `activity-log-timeline.tsx` | `memo()` ile sarmalandı |
| ✅ 31 | A-04: Aria label icon butonlar | `image-gallery.tsx` | 4 navigasyon butonuna aria-label eklendi |
| ✅ 32 | A-05: Focus yönetimi dialog | `product-dialogs.tsx` | `autoFocus` eklendi |
| ✅ 33 | T-02: Raporlar any temizliği | `raporlar/page.tsx`, `types.ts` | `ReportData` interface + typed arrays |
| ✅ 34 | D-01: Tarih formatlama | `utils.ts` + 3 dosya | `formatDateTR("time")` + inline kullanımlar dönüştürüldü |
| ✅ 35 | D-02: Status config tekrarı | `siparisler/`, `iadeler/` | `orderStatusConfig`/`returnStatusConfig`'den dinamik üretim |
| ✅ 36 | E-03: Cart loading sessiz hata | `useCart.ts` | `console.error("Sepet yüklenemedi:", err)` eklendi |
| ✅ 37 | E-07: Root error boundary loglama | `app/error.tsx` | `console.error("Yakalanmamış hata:", error)` eklendi |
| ✅ 38 | T-04: ContactClient form validation | `contact-client.tsx` | `as string` → `.toString().trim()` + zorunlu alan kontrolü |
| ✅ 39 | V-02: Sepet stok doğrulaması | `useCart.ts` | Client-side `maxStock` kontrolü eklendi |
| ✅ 40 | H-05: Checkout loading | `siparis/page.tsx` | Zaten `isLoading` spinner mevcut |
| ✅ 41 | SEO-01: Yasal sayfa metadata | `(yasal)/*/page.tsx` | Tüm 7 sayfada `export const metadata` mevcut |
| ✅ 42 | U-03: Blog empty state ayrımı | `blog-posts-client.tsx` | `searchTerm` kontrolüne göre iki farklı mesaj mevcut |
| ✅ 43 | R-02: Cart+Auth race condition | `auth-context.tsx` | Logout'a `guestCart.clear()` eklendi |
| ✅ 44 | HC-03: PAGE_SIZE merkezileştirme | `lib/constants.ts` + 3 dosya | `ADMIN_PAGE_SIZE` / `CATALOG_PAGE_SIZE` sabitleri |
| ✅ 45 | O-01: Inline keyframes | `giris/page.tsx` → `globals.css` | `@keyframes fadeSlideUp` taşındı |
| ✅ 46 | SE-01: ProductDetail Suspense | `product-page-client.tsx` | Zaten `isCancelled` + doğal loading pattern |
| ✅ 47 | SE-02: Checkout Suspense | `siparis/page.tsx` | Zaten `isLoading` spinner mevcut |
| ✅ 48 | I-01/I-02: Image sizes | Tüm Image component'ler | Zaten doğru `sizes` prop'ları mevcut |

---

## KISMEN ÇÖZÜLMÜŞ SORUNLAR

| # | Sorun | Durum | Kalan İş |
|---|-------|-------|----------|
| 🟡 1 | admin/page.tsx — 411 satır | Dashboard alt bileşenleri çıkarıldı | Ana component hâlâ koordinasyon mantığı taşıyor |
| 🟡 2 | product-detail.tsx — 449 satır | useProductActions hook çıkarıldı | WhatsApp butonu, trust badges hâlâ inline |
| 🟡 3 | admin/ayarlar/page.tsx — 516 satır | Tab bileşenleri oluşturuldu | Tab mantığı hâlâ ana dosyada |
| 🟡 4 | Admin sayfalarında useState yığılması | Bazı hook'lar çıkarıldı | useReducer geçişi tamamlanmadı |

---

## DOSYA BAZLI REFACTORING PLANLARI

*(Detaylı bölüm tabloları yukarıdaki S-01 → S-11 maddelerinde yer almaktadır)*

---

## YATAY SORUNLAR (CROSS-CUTTING)

### ✅ Y-01. Header/Footer — ÇÖZÜLDÜ
- **Durum:** ✅ **Çözüldü** — Header 90 satıra düştü (387'den); Footer statik JSX, layout.tsx seviyesinde render ediliyor. Alt bileşenler çıkarıldı.

### ✅ Y-02. Tarih Formatlama Tutarsızlığı — ÇÖZÜLDÜ
`toLocaleDateString("tr-TR", ...)` en az 10 farklı dosyada inline tekrarlanıyor → Tüm kullanımlar `formatDateTR(date, format)` utility'sine yönlendirildi. `"time"` formatı da eklendi.

### ✅ Y-03. Status Label/Config Tekrarı — ÇÖZÜLDÜ
`statusConfig`, `statusLabels` gibi objeler en az 3 farklı dosyada tekrar tanımlanmış → `lib/commerce/order-utils.ts` içinde tek yerde toplanarak `orderStatusConfig`/`returnStatusConfig`'den dinamik kullanıma geçildi.

### ✅ Y-04. Cart Event Dispatching — ÇÖZÜLDÜ
- **Durum:** ✅ **Phase 7'de çözüldü** — `useCart` hook'una `"cart-updated"` + `"storage"` event listener'ları eklendi. Zustand refactorü gereksiz.

### ✅ Y-05. Error Message Pattern — ÇÖZÜLDÜ
`error instanceof Error ? error.message : "..."` 10+ dosyada tekrar → `getErrorMessage()` utility Phase 7'de oluşturuldu ve tüm ilgili dosyalarda kullanıma alındı.

---

## ÖNCELİK SIRASI (AKSİYON PLANI)

### 🔴 Acil (Bu Sprint)
- [x] **C-01** — Invoice XSS: `window.open` + `document.write` → Blob URL ✅
- [x] **C-03** — Error message information disclosure → safe mapping ✅
- [ ] **C-05** — CSRF token doğrulaması
- [x] **C-06, C-07** — Tüm formlara input validation ✅
- [x] **C-02** — ExchangeRateTicker: caching + hata yönetimi ✅
- [x] **M-01, M-02** — Memory leak: AbortController / cancellation flag ✅

### 🟡 Sonraki Sprint
- [x] **S-01 → S-07** — 500+ satırlık dosyaları böl ✅ (hepsi kabul edilebilir seviyeye düştü)
- [x] **T-01, T-02** — Tüm `any` tiplerini elimine et ✅
- [x] **E-07 → E-10** — Tüm eksik error boundary'leri oluştur ✅
- [x] **S-10** — Checkout prop drilling → Kabul edilebilir (hook'larla çözüldü) ✅
- [x] **R-01** — Cart cross-tab sync ✅
- [x] **A-01 → A-05** — Erişilebilirlik düzeltmeleri ✅ (A-04 kısmi)

### 📋 Backlog
- [x] **Y-04** — Cart event listener'lar eklendi ✅ (Zustand gereksiz)
- [x] **SEO-02** — Product structured data zenginleştirme ✅
- [x] **HC-01 → HC-05** — Hardcoded değerleri config'e taşı ✅
- [x] **D-01 → D-04** — Kod tekrarını elimine et ✅
- [x] **H-06** — Blog debounce ✅
- [x] **U-01** — Unused import cleanup ✅ (lint sonucu: yok)
