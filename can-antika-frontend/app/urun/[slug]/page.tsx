import type { Metadata } from "next"
import { cache } from "react"

import { ProductPageClient } from "./product-page-client"
import { fetchApiDataWithFallback } from "@/lib/server-api-fallback"
import type { ProductResponse } from "@/lib/types"

const fetchProduct = cache(async (slug: string) => {
  const safeSlug = encodeURIComponent(slug)
  return fetchApiDataWithFallback<ProductResponse>(`/v1/product/slug/${safeSlug}`, {
    revalidate: 60,
    timeoutMs: 1200,
  })
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)

  if (!product) {
    return {
      title: "Ürün",
      description: "Can Antika urun detay sayfasi.",
    }
  }

  const safeTitle = product.title?.trim() || "Ürün"
  const description = product.description
    ? product.description.slice(0, 160)
    : `${safeTitle} - Can Antika koleksiyonundan antika eser. \u20BA${product.price?.toLocaleString("tr-TR")}`

  return {
    title: safeTitle,
    description,
    keywords: [safeTitle, product.category?.name, "antika", "koleksiyon", "can antika"].filter(
      (keyword): keyword is string => Boolean(keyword)
    ),
    openGraph: {
      title: `${safeTitle} | Can Antika`,
      description,
      type: "website",
      locale: "tr_TR",
      images: product.imageUrls?.[0] ? [{ url: product.imageUrls[0] }] : [],
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

  return <ProductPageClient initialProduct={product} slug={slug} />
}
