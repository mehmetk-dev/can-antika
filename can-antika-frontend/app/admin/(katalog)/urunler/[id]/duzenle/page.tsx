"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { productApi } from "@/lib/api"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { ProductResponse, ProductRequest } from "@/lib/types"

const ProductForm = dynamic(() => import("@/components/admin/product-form").then(m => ({ default: m.ProductForm })), {
    loading: () => (
        <div className="flex items-center justify-center py-32">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    ),
})

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [product, setProduct] = useState<ProductResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        productApi.getById(Number(id))
            .then(setProduct)
            .catch((error) => {
                const message = error instanceof Error ? error.message : "Ürün yüklenemedi"
                toast.error(message)
            })
            .finally(() => setIsLoading(false))
    }, [id])

    const handleSubmit = async (data: ProductRequest) => {
        try {
            await productApi.update(Number(id), data)
            toast.success("Ürün başarıyla güncellendi")
            router.push("/admin/urunler")
        } catch (error) {
            const message = error instanceof Error ? error.message : "Güncelleme sırasında hata oluştu"
            toast.error(message)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Ürün yükleniyor...</p>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <p className="text-muted-foreground">Ürün bulunamadı</p>
                <Link href="/admin/urunler">
                    <Button variant="outline" className="mt-4">Ürünlere Dön</Button>
                </Link>
            </div>
        )
    }

    return (
        <ProductForm
            product={product}
            onSubmit={handleSubmit}
            title="Ürünü Düzenle"
            subtitle={'CAN-' + product.id.toString().padStart(4, '0')}
        />
    )
}