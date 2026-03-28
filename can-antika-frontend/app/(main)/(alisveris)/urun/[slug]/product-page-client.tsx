"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, PackageSearch } from "lucide-react"

import { productApi } from "@/lib/api"
import { ProductDetail } from "@/components/product/product-detail"
import { Button } from "@/components/ui/button"
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
        return productApi.getById(numericId, 5000)
      }

      return productApi.getBySlug(slug, 5000)
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

  const productSlug = product?.slug
  useEffect(() => {
    if (!productSlug || productSlug === slug) return
    router.replace(`/urun/${productSlug}`)
  }, [productSlug, slug, router])

  const viewCountedRef = useRef<number | null>(null)
  const productId = product?.id ?? null
  useEffect(() => {
    if (!productId || viewCountedRef.current === productId) return
    viewCountedRef.current = productId
    void productApi.incrementViewCount(productId).catch(() => {
      // Metrik güncellemesi başarısız olsa da kullanıcıya hissettirme
    })
  }, [productId])

  const categoryId = product?.category?.id ?? null
  useEffect(() => {
    if (!productId) return
    let isCancelled = false

    const loadRelatedProducts = async () => {
      try {
        const sameCategoryResult = categoryId
          ? await productApi.search({ categoryId, size: 12 }, 4000)
          : { items: [] as ProductResponse[] }

        const sameCategoryFiltered = (sameCategoryResult.items || []).filter((item) => item.id !== productId)

        if (sameCategoryFiltered.length >= 4) {
          if (!isCancelled) setRelatedProducts(sameCategoryFiltered.slice(0, 4))
          return
        }

        // Only fetch fallback if category results aren't enough
        const latestProducts = await productApi.getAll(0, 20, "id", "desc")

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
    return (
      <div className="bg-background">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
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