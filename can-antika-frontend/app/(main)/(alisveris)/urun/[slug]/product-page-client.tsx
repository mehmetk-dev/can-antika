"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PackageSearch } from "lucide-react"

import { productApi } from "@/lib/api"
import { ProductDetail } from "@/components/product/product-detail"
import { Button } from "@/components/ui/button"
import { getProductUrl } from "@/lib/product/product-url"
import type { ProductResponse } from "@/lib/types"

interface ProductPageClientProps {
  initialProduct: ProductResponse | null
  slug: string
}

export function ProductPageClient({ initialProduct, slug }: ProductPageClientProps) {
  const router = useRouter()

  const [product, setProduct] = useState<ProductResponse | null>(initialProduct)
  const [isLoading, setIsLoading] = useState(!initialProduct)
  const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([])

  // Hide the server-rendered shell once the full client component is ready
  useEffect(() => {
    if (!isLoading && product) {
      const shell = document.getElementById("product-ssr-shell")
      if (shell) shell.style.display = "none"
    }
  }, [isLoading, product])

  useEffect(() => {
    let isCancelled = false

    if (initialProduct) {
      return () => {
        isCancelled = true
      }
    }

    const numericId = /^\d+$/.test(slug) ? Number.parseInt(slug, 10) : null

    const fetchProduct = async () => {
      if (numericId !== null) {
        return productApi.getById(numericId, 3000)
      }

      // Önce sondaki ID ile dene — en hızlı yol (ör: "gumus-kemer-tokasi-76" → id=76)
      const trailingMatch = slug.match(/-(\d+)$/)
      if (trailingMatch) {
        const trailingId = Number.parseInt(trailingMatch[1], 10)
        if (Number.isFinite(trailingId)) {
          try {
            return await productApi.getById(trailingId, 3000)
          } catch {
            // ID ile bulunamazsa slug ile dene
          }
        }
      }

      // Slug ile dene (ID suffix'i çıkarılmış hali)
      const slugWithoutId = trailingMatch ? slug.replace(/-\d+$/, "") : slug
      try {
        return await productApi.getBySlug(slugWithoutId, 3000)
      } catch {
        // Slug ile de bulunamazsa, tam slug ile dene
        if (trailingMatch) {
          return productApi.getBySlug(slug, 3000)
        }
        throw new Error("Product not found")
      }
    }

    fetchProduct()
      .then((fetchedProduct) => {
        if (!isCancelled) {
          setProduct(fetchedProduct)
        }
      })
      .catch(() => {
        if (!isCancelled && !initialProduct) {
          setProduct(null)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [initialProduct, slug])

  const productId = product?.id ?? null
  const canonicalSlug = product ? getProductUrl(product).replace('/urun/', '') : null
  useEffect(() => {
    if (!canonicalSlug || canonicalSlug === slug) return
    router.replace(`/urun/${canonicalSlug}`, { scroll: false })
  }, [canonicalSlug, slug, router])

  const viewCountedRef = useRef<number | null>(null)
  useEffect(() => {
    if (!productId || viewCountedRef.current === productId) return
    viewCountedRef.current = productId
    const fire = () => void productApi.incrementViewCount(productId).catch(() => {
      // Metrik güncellemesi başarısız olsa da kullanıcıya hissettirme
    })
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(fire, { timeout: 3000 })
      return () => cancelIdleCallback(id)
    }
    const timer = setTimeout(fire, 2000)
    return () => clearTimeout(timer)
  }, [productId])

  const categoryId = product?.category?.id ?? null
  useEffect(() => {
    if (!productId) return
    let isCancelled = false

    const loadRelatedProducts = async () => {
      try {
        const sameCategoryResult = categoryId
          ? await productApi.search({ categoryId, size: 5 }, 2000)
          : { items: [] as ProductResponse[] }

        const sameCategoryFiltered = (sameCategoryResult.items || []).filter((item) => item.id !== productId)

        if (sameCategoryFiltered.length >= 4) {
          if (!isCancelled) setRelatedProducts(sameCategoryFiltered.slice(0, 4))
          return
        }

        // Only fetch fallback if category results aren't enough
        const latestProducts = await productApi.getAll(0, 5, "id", "desc")

        const fallbackProducts = (latestProducts.items ?? []).filter(
          (item) =>
            item.id !== productId &&
            !sameCategoryFiltered.some((same) => same.id === item.id)
        )

        const merged = [...sameCategoryFiltered, ...fallbackProducts].slice(0, 4)
        if (!isCancelled) setRelatedProducts(merged)
      } catch {
        if (!isCancelled) setRelatedProducts([])
      }
    }

    void loadRelatedProducts()

    return () => {
      isCancelled = true
    }
  }, [productId, categoryId])

  if (isLoading) {
    // Suspense fallback (ProductLoading skeleton) is already visible —
    // returning null keeps the same skeleton instead of switching to a spinner.
    return null
  }

  if (!product) {
    return (
      <div className="bg-background">
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <PackageSearch className="h-16 w-16 text-muted-foreground/40 mb-6" />
          <h1 className="font-serif text-3xl font-bold text-foreground">Ürün Bulunamadı</h1>
          <p className="mt-3 text-muted-foreground max-w-md">
            Aradığınız ürün bulunamadı veya kaldırılmış olabilir.
          </p>
          <Button asChild className="mt-8">
            <Link href="/urunler">Ürünlere Dön</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </div>
  )
}