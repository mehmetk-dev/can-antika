"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { ShoppingBasket, Loader2, ChevronDown, ChevronUp, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { reportApi } from "@/lib/api"

interface AbandonedCart {
    cartId: number
    userId: number
    userName: string
    userEmail: string
    cartTotal: number
    itemCount: number
    lastActivity: string
    items: { productId: number; productTitle: string; productImage?: string; quantity: number; price: number }[]
}

export default function AbandonedCartsPage() {
    const [carts, setCarts] = useState<AbandonedCart[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<number | null>(null)

    useEffect(() => {
        reportApi.abandonedCarts(0, 50)
            .then((res) => setCarts((res.items as unknown as AbandonedCart[]) || []))
            .catch(() => toast.error("Veriler yüklenemedi"))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">Terk Edilen Sepetler</h1>
                <p className="text-muted-foreground">24 saatten fazla süredir güncellenmemiş sepetler</p>
            </div>

            <div className="text-sm text-muted-foreground">
                Toplam <span className="font-semibold text-foreground">{carts.length}</span> terk edilmiş sepet
            </div>

            {carts.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <ShoppingBasket className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Terk edilmiş sepet bulunamadı</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {carts.map((cart) => (
                        <Card key={cart.cartId}>
                            <CardContent className="p-0">
                                <button
                                    className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                                    onClick={() => setExpanded(expanded === cart.cartId ? null : cart.cartId)}
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-semibold text-sm shrink-0">
                                            {cart.userName?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{cart.userName || "Anonim"}</p>
                                            <p className="text-xs text-muted-foreground">{cart.userEmail}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-semibold">₺{Number(cart.cartTotal).toLocaleString("tr-TR")}</p>
                                            <p className="text-xs text-muted-foreground">{cart.itemCount} ürün</p>
                                        </div>
                                        <Badge variant="outline" className="hidden md:flex">{timeAgo(cart.lastActivity)}</Badge>
                                        {expanded === cart.cartId ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                </button>

                                {expanded === cart.cartId && cart.items && (
                                    <div className="border-t px-4 pb-4 pt-3 space-y-2">
                                        {cart.items.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                {item.productImage ? (
                                                    <Image src={item.productImage} alt={item.productTitle || "Ürün"} width={32} height={32} className="h-8 w-8 rounded object-cover" unoptimized />
                                                ) : (
                                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                        <Package className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <span className="text-sm flex-1 truncate">{item.productTitle}</span>
                                                <span className="text-xs text-muted-foreground">{item.quantity}x</span>
                                                <span className="text-sm font-medium">₺{Number(item.price).toLocaleString("tr-TR")}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function timeAgo(dateStr: string): string {
    if (!dateStr) return ""
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 24) return `${hours} saat önce`
    const days = Math.floor(hours / 24)
    return `${days} gün önce`
}
