"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { productApi } from "@/lib/api"
import { ProductDetail } from "@/components/product/product-detail"
import type { ProductResponse } from "@/lib/types"

interface ProductPageClientProps {
    initialProduct: ProductResponse
    slug: string
}

export function ProductPageClient({ initialProduct, slug }: ProductPageClientProps) {
    const router = useRouter()
    const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([])

    useEffect(() => {
        // Redirect to canonical slug if needed
        if (initialProduct.slug && initialProduct.slug !== slug) {
            router.replace(`/urun/${initialProduct.slug}`)
        }

        // Track view count
        productApi.incrementViewCount(initialProduct.id).catch(() => { })

        // Fetch related products
        if (initialProduct.category?.id) {
            productApi.search({ categoryId: initialProduct.category.id, size: 5 })
                .then((data) => setRelatedProducts(data.items))
                .catch(() => setRelatedProducts([]))
        }
    }, [initialProduct, slug, router])

    return (
        <ProductDetail product={initialProduct} relatedProducts={relatedProducts} />
    )
}
