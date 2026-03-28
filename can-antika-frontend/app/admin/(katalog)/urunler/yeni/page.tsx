"use client"

import { useRouter } from "next/navigation"
import { productApi } from "@/lib/api"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import type { ProductRequest } from "@/lib/types"

const ProductForm = dynamic(() => import("@/components/admin/product-form").then(m => ({ default: m.ProductForm })), {
  loading: () => (
    <div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
})

export default function NewProductPage() {
  const router = useRouter()

  const handleSubmit = async (data: ProductRequest) => {
    try {
      await productApi.save(data)
      toast.success("Ürün başarıyla eklendi")
      router.push("/admin/urunler")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ürün eklenirken hata oluştu"
      toast.error(message)
    }
  }

  return (
    <ProductForm
      onSubmit={handleSubmit}
      title="Yeni Ürün Ekle"
      subtitle="Koleksiyonunuza yeni bir eser ekleyin"
    />
  )
}
