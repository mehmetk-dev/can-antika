import type { Metadata } from "next"
import { cache, Suspense } from "react"

import { ProductPageClient } from "./product-page-client"
import ProductLoading from "./loading"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import { resolveImageUrl } from "@/lib/product/image-url"
import type { ProductResponse } from "@/lib/types"

function parseNumericProductId(slug: string): number | null {
  const trimmed = slug.trim()
  if (!/^\d+$/.test(trimmed)) return null

  const numericId = Number.parseInt(trimmed, 10)
  return Number.isFinite(numericId) ? numericId : null
}

function slugToTitle(slug: string): string {
  const raw = decodeURIComponent(slug || "")
  const normalized = raw
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")

  if (!normalized || /^\d+$/.test(normalized)) return "Urun"

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

async function fetchProductBySlug(slug: string) {
  const safeSlug = encodeURIComponent(slug)
  return fetchApiDataWithFallback<ProductResponse>(`/v1/product/slug/${safeSlug}`, {
    revalidate: 300,
    timeoutMs: 1500,
  })
}

async function fetchProductById(id: number) {
  return fetchApiDataWithFallback<ProductResponse>(`/v1/product/${id}`, {
    revalidate: 300,
    timeoutMs: 1500,
  })
}

const fetchProduct = cache(async (slug: string) => {
  const numericId = parseNumericProductId(slug)
  if (numericId !== null) {
    const productFromId = await fetchProductById(numericId)
    if (productFromId) return productFromId
  }

  return fetchProductBySlug(slug)
})

// Metadata'da ürünü fetch ediyoruz — cache() sayesinde ProductResolver tekrar fetch yapmaz.
// Bu sayede: 1) gerçek SEO metadata  2) OG image  3) Suspense anında çözülür (iskelet gösterilmez)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)

  if (product) {
    const title = product.title
    const description = product.description
      ? product.description.slice(0, 160)
      : `${title} - Can Antika koleksiyonundan antika eser.`
    const imageUrl = product.imageUrls?.[0] ? resolveImageUrl(product.imageUrls[0]) : undefined

    return {
      title,
      description,
      keywords: [title, product.category?.name, "antika", "koleksiyon", "can antika"].filter(Boolean) as string[],
      openGraph: {
        title: `${title} | Can Antika`,
        description,
        type: "website",
        locale: "tr_TR",
        ...(imageUrl && imageUrl !== "/placeholder.svg" && { images: [imageUrl] }),
      },
    }
  }

  const safeTitle = slugToTitle(slug)
  return {
    title: safeTitle,
    description: `${safeTitle} - Can Antika koleksiyonundan antika eser.`,
  }
}

// Suspense streaming: sayfa iskeleti anında gönderilir,
// ürün verisi hazır olunca stream edilir.
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <Suspense fallback={<ProductLoading />}>
      <ProductResolver slug={slug} />
    </Suspense>
  )
}

async function ProductResolver({ slug }: { slug: string }) {
  const product = await fetchProduct(slug)

  const jsonLd = product
    ? {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description ?? undefined,
      image: product.imageUrls?.[0] ?? undefined,
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "TRY",
        availability:
          (product.stock ?? 0) > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      },
      ...(product.averageRating != null &&
        product.reviewCount != null &&
        product.reviewCount > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.averageRating,
          reviewCount: product.reviewCount,
        },
      }),
    }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPageClient initialProduct={product} slug={slug} />
    </>
  )
}
