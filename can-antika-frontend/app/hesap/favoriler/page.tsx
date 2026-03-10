"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Trash2, ShoppingBag, Loader2, Heart } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { wishlistApi, cartApi } from "@/lib/api"
import { toast } from "sonner"
import type { WishlistItemResponse } from "@/lib/types"

function WishlistContent() {
  const [items, setItems] = useState<WishlistItemResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    wishlistApi
      .getWishlist()
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false))
  }, [])

  const handleRemove = async (productId: number) => {
    setRemovingIds((prev) => new Set(prev).add(productId))
    try {
      await wishlistApi.removeItem(productId)
      setItems((prev) => prev.filter((i) => i.product.id !== productId))
      toast.success("Favorilerden kaldırıldı")
    } catch {
      toast.error("Kaldırılırken hata oluştu")
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const handleAddToCart = async (productId: number) => {
    try {
      await cartApi.addItem({ productId, quantity: 1 })
      toast.success("Sepete eklendi")
    } catch {
      toast.error("Sepete eklenirken hata oluştu")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Favoriler yükleniyor...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-serif text-xl text-foreground">Koleksiyonunuz boş</p>
        <p className="mt-2 text-muted-foreground">Beğendiğiniz eserleri favorilerinize ekleyin</p>
        <Link href="/urunler">
          <Button className="mt-4 bg-primary text-primary-foreground">Koleksiyona Göz At</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const product = item.product
        const imageUrl = product.imageUrls?.[0] || "/placeholder.svg"
        const isRemoving = removingIds.has(product.id)
        const outOfStock = (product.stock ?? 0) <= 0

        return (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-lg bg-card"
            style={{ opacity: isRemoving ? 0.5 : 1 }}
          >
            <Link href={`/urun/${product.slug ?? product.id}`}>
              <div className="aspect-[3/4] overflow-hidden relative">
                <img
                  src={imageUrl}
                  alt={product.title}
                  className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${outOfStock ? "grayscale opacity-60" : ""}`}
                />
                {outOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                    <span className="rounded bg-destructive px-3 py-1.5 font-serif text-sm font-semibold text-destructive-foreground">
                      Tükendi
                    </span>
                  </div>
                )}
              </div>
            </Link>

            <div className="p-4">
              {product.category && (
                <p className="text-xs uppercase tracking-wider text-accent">{product.category.name}</p>
              )}
              <h3 className="mt-1 font-serif text-lg font-medium text-foreground line-clamp-1">
                {product.title}
              </h3>
              <p className={`mt-2 font-semibold ${outOfStock ? "text-muted-foreground line-through" : "text-primary"}`}>
                ₺{product.price.toLocaleString("tr-TR")}
              </p>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-2 bg-primary text-primary-foreground"
                  disabled={outOfStock}
                  onClick={() => handleAddToCart(product.id)}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {outOfStock ? "Stokta Yok" : "Sepete Ekle"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent"
                  disabled={isRemoving}
                  onClick={() => handleRemove(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Kaldır</span>
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function WishlistPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <DashboardSidebar />
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Koleksiyonum</h1>
                <p className="mt-2 text-muted-foreground">Favorilerinize eklediğiniz eserler</p>
              </div>
              <WishlistContent />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  )
}
