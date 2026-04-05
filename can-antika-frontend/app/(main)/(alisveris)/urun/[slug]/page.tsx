import type { Metadata } from "next"
import { cache, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

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

/** Slug sonundaki "-123" gibi ID suffix'ini çıkarır */
function extractTrailingId(slug: string): number | null {
  const match = slug.match(/-(\d+)$/)
  if (!match) return null
  const id = Number.parseInt(match[1], 10)
  return Number.isFinite(id) ? id : null
}

function slugToTitle(slug: string): string {
  const raw = decodeURIComponent(slug || "")
  // Sondaki ID suffix'ini kaldır (ör: "gumus-sigara-agizligi-76" → "gumus-sigara-agizligi")
  const withoutId = raw.replace(/-(\d+)$/, "")
  const normalized = withoutId
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
  // 1. Tamamen numerik slug (ör: "76")
  const numericId = parseNumericProductId(slug)
  if (numericId !== null) {
    const productFromId = await fetchProductById(numericId)
    if (productFromId) return productFromId
  }

  // 2. Sondaki ID ile dene — en yaygın durum (ör: "gumus-kemer-tokasi-76" → id=76)
  //    Bu, slug endpoint'inden önce denenir çünkü daha hızlı ve güvenilirdir.
  //    Böylece product.title (Türkçe karakter içeren) metadata'ya yansır.
  const trailingId = extractTrailingId(slug)
  if (trailingId !== null) {
    const productFromTrailingId = await fetchProductById(trailingId)
    if (productFromTrailingId) return productFromTrailingId
  }

  // 3. Slug ile dene (ID suffix'i çıkarılmış hali)
  const slugWithoutId = trailingId !== null ? slug.replace(/-\d+$/, "") : slug
  const productFromSlug = await fetchProductBySlug(slugWithoutId)
  if (productFromSlug) return productFromSlug

  // 4. Tam slug ile dene (slug kendisi rakamla bitiyorsa)
  if (trailingId !== null) {
    const productFromFullSlug = await fetchProductBySlug(slug)
    if (productFromFullSlug) return productFromFullSlug
  }

  return null
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

  const mainImageUrl = product?.imageUrls?.[0]
    ? resolveImageUrl(product.imageUrls[0])
    : null

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
      {/* Preload LCP image — tarayıcı JS beklemeden görseli indirmeye başlar */}
      {mainImageUrl && mainImageUrl !== "/placeholder.svg" && (
        <link rel="preload" as="image" href={mainImageUrl} fetchPriority="high" />
      )}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Server-rendered shell: title, price, image visible before JS loads */}
      {product && (
        <div id="product-ssr-shell" className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb — server-rendered, no hydration needed */}
          <nav className="py-4" aria-label="Breadcrumb">
            <ol className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link></li>
              <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
              <li><Link href="/urunler" className="hover:text-primary transition-colors">Ürünler</Link></li>
              <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
              <li className="max-w-[150px] truncate font-medium text-foreground sm:max-w-[220px]">{product.title}</li>
            </ol>
          </nav>

          <div className="grid gap-6 sm:gap-12 lg:grid-cols-2 lg:gap-20 items-start pb-8">
            {/* Main image — server-rendered */}
            {mainImageUrl && mainImageUrl !== "/placeholder.svg" && (
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={mainImageUrl}
                  alt={product.title}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
            )}

            {/* Title + price — server-rendered */}
            <div className="flex flex-col pt-2 lg:pt-0">
              {product.category?.name && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Koleksiyon</span>
                </div>
              )}
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
                {product.title}
              </h1>
              <p className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
                ₺{product.price?.toLocaleString("tr-TR")}
              </p>
              {product.description && (
                <p className="mt-4 text-base text-muted-foreground leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full interactive client component — hides the shell via CSS once hydrated */}
      <ProductPageClient initialProduct={product} slug={slug} />
    </>
  )
}
