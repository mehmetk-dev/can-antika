import type { Metadata } from "next"

import { ProductPageClient } from "./product-page-client"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
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
    revalidate: 60,
    timeoutMs: 1800,
  })
}

async function fetchProductById(id: number) {
  return fetchApiDataWithFallback<ProductResponse>(`/v1/product/${id}`, {
    revalidate: 60,
    timeoutMs: 1800,
  })
}

async function fetchProduct(slug: string) {
  const numericId = parseNumericProductId(slug)
  if (numericId !== null) {
    const productFromId = await fetchProductById(numericId)
    if (productFromId) return productFromId
  }

  return fetchProductBySlug(slug)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)
  const safeTitle = product?.title || slugToTitle(slug)
  const description = product?.description
    ? product.description.slice(0, 160)
    : `${safeTitle} - Can Antika koleksiyonundan antika eser.`

  const images = product?.imageUrls?.[0]
    ? [{ url: product.imageUrls[0], alt: safeTitle }]
    : []

  return {
    title: safeTitle,
    description,
    keywords: [safeTitle, "antika", "koleksiyon", "can antika"].filter(
      (keyword): keyword is string => Boolean(keyword)
    ),
    openGraph: {
      title: `${safeTitle} | Can Antika`,
      description,
      type: "website",
      locale: "tr_TR",
      images,
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
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
