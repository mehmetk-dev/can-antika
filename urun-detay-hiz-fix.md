# Ürün Detay Sayfası Geç Açılma Düzeltmeleri

---

## 1. `can-antika-frontend/lib/server/server-api-fallback.ts`

**Sorun:** Backend URL adayları sırayla deneniyor, her biri 1500ms bekliyordu. 3 aday = ~4.5 saniye.

**Eski:**
```ts
// Sequential fallback through candidates with a shorter per-candidate timeout
const perCandidateTimeout = Math.min(timeoutMs, 1500)

for (const baseUrl of baseUrls) {
  if (baseUrl === lastWorkingBaseUrl) continue
  try {
    const result = await tryFetch<T>(baseUrl, path, revalidate, perCandidateTimeout)
    if (result) {
      lastWorkingBaseUrl = baseUrl
      return result
    }
  } catch {
    // Try next candidate
  }
}

return null
```

**Yeni:**
```ts
// Try all remaining candidates in parallel — first success wins
const candidates = baseUrls.filter((u) => u !== lastWorkingBaseUrl)
if (candidates.length === 0) return null

try {
  const { result, baseUrl } = await Promise.any(
    candidates.map(async (baseUrl) => {
      const result = await tryFetch<T>(baseUrl, path, revalidate, timeoutMs)
      if (result === null) throw new Error("no data")
      return { result, baseUrl }
    })
  )
  lastWorkingBaseUrl = baseUrl
  return result
} catch {
  return null
}
```

---

## 2. `can-antika-frontend/app/(main)/(alisveris)/urun/[slug]/page.tsx`

**Sorun:** `generateMetadata` ve `ProductPage` ikisi de `fetchProduct` çağırıyordu, aynı API'ye 2 kez istek atılıyordu.

**Eski:**
```ts
import type { Metadata } from "next"
// ...

async function fetchProduct(slug: string) {
  const numericId = parseNumericProductId(slug)
  if (numericId !== null) {
    const productFromId = await fetchProductById(numericId)
    if (productFromId) return productFromId
  }
  return fetchProductBySlug(slug)
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const product = await fetchProduct(slug) // 1. API çağrısı
  // ...
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  const product = await fetchProduct(slug) // 2. API çağrısı (tekrar!)
  // ...
}
```

**Yeni:**
```ts
import type { Metadata } from "next"
import { cache } from "react"
// ...

// React cache() — aynı request içinde ikinci çağrıda API'ye gitmiyor, sonucu döner
const fetchProduct = cache(async (slug: string) => {
  const numericId = parseNumericProductId(slug)
  if (numericId !== null) {
    const productFromId = await fetchProductById(numericId)
    if (productFromId) return productFromId
  }
  return fetchProductBySlug(slug)
})

export async function generateMetadata({ params }) {
  const { slug } = await params
  const product = await fetchProduct(slug) // 1. API çağrısı → API'ye gider
  // ...
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  const product = await fetchProduct(slug) // önbellekten döner, API'ye gitmiyor
  // ...
}
```

---

## 3. `can-antika-frontend/components/catalog/product-card.tsx`

**Sorun:** `prefetch={false}` olduğu için ürünün üzerine gelindiğinde hiçbir şey yüklenmiyordu, tıklayınca sıfırdan başlıyordu.

**Eski:**
```tsx
<Link
  href={`/urun/${product.slug ?? product.id}`}
  prefetch={false}
  className="group relative block overflow-hidden ..."
>
```

**Yeni:**
```tsx
<Link
  href={`/urun/${product.slug ?? product.id}`}
  className="group relative block overflow-hidden ..."
>
```

> `prefetch` varsayılan olarak `true` — ürünün üzerine gelindiğinde Next.js JS bundle'ını arka planda indirir, tıklanınca anında açılır.
