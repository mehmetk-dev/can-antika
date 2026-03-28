"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Minus, Plus, Trash2, ShoppingBag, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/useCart"

function CartContent() {
    const router = useRouter()
    const {
        items, cartTotal, itemCount, isLoading, isGuest,
        updatingItems, handleUpdateQuantity, handleRemoveItem, handleClearCart,
    } = useCart()

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Sepet yükleniyor...</p>
            </div>
        )
    }

    if (!itemCount) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">Sepetiniz Boş</h2>
                <p className="mt-2 text-muted-foreground max-w-md">
                    Henüz sepetinize ürün eklemediniz. Koleksiyonumuzu keşfetmek için ürünler sayfasını ziyaret edin.
                </p>
                <Link href="/urunler">
                    <Button className="mt-6 gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Ürünleri Keşfet
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-serif text-xl font-semibold text-foreground">
                        Sepetim ({itemCount} ürün)
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCart}
                        className="text-destructive hover:text-destructive/80 text-sm"
                    >
                        Sepeti Temizle
                    </Button>
                </div>

                {items.map((item) => {
                    const imageUrl = item.product.imageUrls?.[0] || "/placeholder.svg"
                    const isUpdating = updatingItems.has(item.product.id)
                    const maxStock = Math.max(item.product.stock ?? 0, 0)

                    return (
                        <div
                            key={item.id}
                            className="flex gap-4 rounded-lg border border-border bg-card p-4 transition-opacity"
                            style={{ opacity: isUpdating ? 0.6 : 1 }}
                        >
                            {/* Product Image */}
                            <Link href={`/urun/${item.product.slug ?? item.product.id}`} className="shrink-0">
                                <Image
                                    src={imageUrl}
                                    alt={item.product.title}
                                    width={128}
                                    height={128}
                                    className="h-24 w-24 rounded-md object-cover sm:h-32 sm:w-32"
                                />
                            </Link>

                            {/* Product Info */}
                            <div className="flex flex-1 flex-col justify-between min-w-0">
                                <div>
                                    <Link href={`/urun/${item.product.slug ?? item.product.id}`}>
                                        <h3 className="font-serif font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                                            {item.product.title}
                                        </h3>
                                    </Link>
                                    {item.product.category && (
                                        <p className="text-xs text-muted-foreground mt-1">{item.product.category.name}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={isUpdating || item.quantity <= 1}
                                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={isUpdating || maxStock <= 0 || item.quantity >= maxStock}
                                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {/* Price & Remove */}
                                    <div className="flex items-center gap-4">
                                        <p className="font-semibold text-primary">
                                            â‚º{item.total.toLocaleString("tr-TR")}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            disabled={isUpdating}
                                            onClick={() => handleRemoveItem(item.product.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Sipariş Özeti</h3>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Ara Toplam</span>
                            <span className="text-foreground">â‚º{cartTotal.toLocaleString("tr-TR")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Kargo</span>
                            <span className="text-foreground">Ücretsiz</span>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between font-semibold">
                        <span className="text-foreground">Toplam</span>
                        <span className="text-primary text-lg">₺{cartTotal.toLocaleString("tr-TR")}</span>
                    </div>

                    {isGuest ? (
                        <Button className="w-full mt-6 gap-2" onClick={() => router.push("/giris?redirect=/sepet")}>
                            Satın Almak İçin Giriş Yapın
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Link href="/siparis">
                            <Button className="w-full mt-6 gap-2">
                                Siparişi Tamamla
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}

                    <Link href="/urunler">
                        <Button variant="outline" className="w-full mt-2">
                            Alışverişe Devam Et
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function CartPage() {
    return (
        <div className="bg-background">
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <div className="mb-8">
                    <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Sepetim</h1>
                </div>
                <CartContent />
            </main>
        </div>
    )
}
