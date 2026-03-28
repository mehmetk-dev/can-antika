"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, PackageSearch } from "lucide-react"

import { productApi } from "@/lib/api"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
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

    const numericId = /^\d+$/.test(slug) ? Number.parseInt(slug, 10) : null

    const fetchProduct = async () => {
      if (numericId !== null) {
        return productApi.getById(numericId, 10000)
      }

      return productApi.getBySlug(slug, 10000)
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

  useEffect(() => {
    if (!product || !product.slug || product.slug === slug) return
    router.replace(`/urun/${product.slug}`)
  }, [product, slug, router])

  useEffect(() => {
    const productId = product?.id
    if (!productId) return
    void productApi.incrementViewCount(productId).catch(() => {
      // Best-effort metric update
    })
  }, [product?.id])

  useEffect(() => {
    if (!product) return
    let isCancelled = false

    const loadRelatedProducts = async () => {
      try {
        const sameCategoryItems = product.category?.id
          ? (await productApi.search({ categoryId: product.category.id, size: 12 }, 4000)).items
          : []

        const sameCategoryFiltered = (sameCategoryItems || []).filter((item) => item.id !== product.id)

        if (sameCategoryFiltered.length >= 4) {
          if (!isCancelled) setRelatedProducts(sameCategoryFiltered.slice(0, 4))
          return
        }

        const latestProducts = await productApi.getAll(0, 20, "id", "desc")
        const fallbackProducts = (latestProducts.items ?? []).filter(
          (item) =>
            item.id !== product.id &&
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
  }, [product])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header sticky={false} />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer className="mt-0" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header sticky={false} />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <PackageSearch className="h-16 w-16 text-muted-foreground/40 mb-6" />
          <h1 className="font-serif text-3xl font-bold text-foreground">Urun bulunamadi</h1>
          <p className="mt-3 text-muted-foreground max-w-md">
            Aradiginiz urun bulunamadi veya kaldirilmis olabilir.
          </p>
          <Button asChild className="mt-8">
            <Link href="/urunler">Urunlere don</Link>
          </Button>
        </div>
        <Footer className="mt-0" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header sticky={false} />
      <ProductDetail product={product} relatedProducts={relatedProducts} />
      <Footer className="mt-0" />
    </div>
  )
}
