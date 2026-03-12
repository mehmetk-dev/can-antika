import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Tag, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { CartResponse } from "@/lib/types"
import type { CouponState } from "@/hooks/useCoupon"

interface OrderSummaryProps {
    cart: CartResponse
    cartTotal: number
    itemCount: number
    coupon: CouponState
    finalTotal: number
    isPlacing: boolean
    selectedAddressId: number | null
    onPlaceOrder: () => void
}

export function OrderSummary({
    cart,
    cartTotal,
    itemCount,
    coupon,
    finalTotal,
    isPlacing,
    selectedAddressId,
    onPlaceOrder,
}: OrderSummaryProps) {
    return (
        <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Sipariş Özeti</h3>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <Image
                                src={item.product.imageUrls?.[0] || "/placeholder.svg"}
                                alt={item.product.title}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-md object-cover"
                                unoptimized
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.product.title}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} adet</p>
                            </div>
                            <p className="text-sm font-medium text-foreground whitespace-nowrap">
                                ₺{item.total.toLocaleString("tr-TR")}
                            </p>
                        </div>
                    ))}
                </div>

                <Separator className="my-4" />

                {/* Kupon Alanı */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" /> Kupon Kodu
                    </p>
                    {coupon.appliedCoupon ? (
                        <div className="flex items-center justify-between rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
                            <div className="flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5 text-primary" />
                                <span className="text-sm font-medium text-primary">{coupon.appliedCoupon}</span>
                            </div>
                            <button
                                onClick={coupon.handleRemoveCoupon}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Kupon kodunuz"
                                value={coupon.couponCode}
                                onChange={(e) => coupon.setCouponCode(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && coupon.handleApplyCoupon()}
                                className="bg-muted/50 text-sm uppercase"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={coupon.handleApplyCoupon}
                                disabled={coupon.isApplyingCoupon || !coupon.couponCode.trim()}
                                className="shrink-0"
                            >
                                {coupon.isApplyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Uygula"}
                            </Button>
                        </div>
                    )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ara Toplam ({itemCount} ürün)</span>
                        <span className="text-foreground">₺{cartTotal.toLocaleString("tr-TR")}</span>
                    </div>
                    {coupon.discount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-primary">Kupon İndirimi</span>
                            <span className="text-primary">-₺{coupon.discount.toLocaleString("tr-TR")}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kargo</span>
                        <span className="text-foreground">Ücretsiz</span>
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Toplam</span>
                    <span className="text-primary text-lg">₺{finalTotal.toLocaleString("tr-TR")}</span>
                </div>

                <Button
                    className="w-full mt-6 gap-2"
                    disabled={isPlacing || !selectedAddressId}
                    onClick={onPlaceOrder}
                >
                    {isPlacing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            İşleniyor...
                        </>
                    ) : (
                        "Siparişi Onayla"
                    )}
                </Button>

                <Link href="/sepet">
                    <Button variant="ghost" className="w-full mt-2 gap-2 text-muted-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Sepete Dön
                    </Button>
                </Link>
            </div>
        </div>
    )
}
