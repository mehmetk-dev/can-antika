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

    if (initialProduct) {
      setProduct(initialProduct)
      setIsLoading(false)
      return () => {
        isCancelled = true
      }
    }

    setIsLoading(true)
    const numericId = /^\d+$/.test(slug) ? Number.parseInt(slug, 10) : null

    const fetchProduct = async () => {
      try {
        return await productApi.getBySlug(slug)
      } catch {
        if (numericId !== null) {
          return productApi.getById(numericId)
        }
        throw new Error("product-not-found")
      }
    }

    fetchProduct()
      .then((fetchedProduct) => {
        if (!isCancelled) {
          setProduct(fetchedProduct)
        }
      })
      .catch(() => {
        if (!isCancelled) {
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
    if (!product) return

    if (product.slug && product.slug !== slug) {
      router.replace(`/urun/${product.slug}`)
    }

    if (product.title) {
      document.title = `${product.title} | Can Antika`
    }

    if (product.category?.id) {
      productApi
        .search({ categoryId: product.category.id, size: 5 })
        .then((data) => setRelatedProducts(data.items))
        .catch(() => setRelatedProducts([]))
    } else {
      setRelatedProducts([])
    }
  }, [product, slug, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
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
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductDetail product={product} relatedProducts={relatedProducts} />
      <Footer />
    </div>
  )
}
