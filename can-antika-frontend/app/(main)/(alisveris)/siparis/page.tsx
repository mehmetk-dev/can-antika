"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AuthGuard } from "@/components/auth/auth-guard"
import { orderApi } from "@/lib/api"
import { toast } from "sonner"
import { useCheckoutData } from "@/hooks/useCheckoutData"
import { useCoupon } from "@/hooks/useCoupon"
import { AddressSelector } from "@/components/checkout/address-selector"
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector"
import { OrderSummary } from "@/components/checkout/order-summary"
import { OrderConfirmation } from "@/components/checkout/order-confirmation"

function CheckoutContent() {
    const router = useRouter()
    const {
        cart, addresses, selectedAddressId, setSelectedAddressId,
        note, setNote, isLoading, cartTotal, itemCount,
    } = useCheckoutData()

    const coupon = useCoupon(cartTotal)
    const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "EFT" | "CASH_ON_DELIVERY">("CREDIT_CARD")
    const [isPlacing, setIsPlacing] = useState(false)
    const [orderPlaced, setOrderPlaced] = useState(false)
    const [orderId, setOrderId] = useState<number | null>(null)

    const finalTotal = Math.max(0, cartTotal - coupon.discount)

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            toast.error("Lütfen teslimat adresi seçin")
            return
        }
        setIsPlacing(true)
        try {
            const order = await orderApi.createOrder({
                addressId: selectedAddressId,
                note: note || undefined,
                paymentStatus: paymentMethod === "CREDIT_CARD" ? "PAID" : "PENDING",
            })
            // Sipariş sonrası sepet badge'ini sıfırla
            if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"))
            setOrderPlaced(true)
            setOrderId(order.id)
            toast.success("Siparişiniz başarıyla oluşturuldu!")
        } catch {
            toast.error("Sipariş oluşturulurken hata oluştu")
        } finally {
            setIsPlacing(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
            </div>
        )
    }

    if (orderPlaced && orderId) {
        return <OrderConfirmation orderId={orderId} />
    }

    if (!cart || itemCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="font-serif text-2xl text-foreground">Sepetiniz Boş</p>
                <p className="mt-2 text-muted-foreground">Sipariş vermek için önce sepetinize ürün ekleyin.</p>
                <Link href="/urunler">
                    <Button className="mt-6">Ürünleri Keşfet</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                <AddressSelector
                    addresses={addresses}
                    selectedAddressId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                />

                <PaymentMethodSelector
                    paymentMethod={paymentMethod}
                    onSelect={setPaymentMethod}
                />

                {/* Sipariş Notu */}
                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle className="font-serif">Sipariş Notu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Siparişiniz hakkında eklemek istediğiniz not (opsiyonel)..."
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="bg-muted/50"
                        />
                    </CardContent>
                </Card>
            </div>

            <OrderSummary
                cart={cart}
                cartTotal={cartTotal}
                itemCount={itemCount}
                coupon={coupon}
                finalTotal={finalTotal}
                isPlacing={isPlacing}
                selectedAddressId={selectedAddressId}
                onPlaceOrder={handlePlaceOrder}
            />
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <AuthGuard>
            <div className="bg-background">
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                    <div className="mb-8">
                        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Ödeme</h1>
                        <p className="mt-1 text-muted-foreground">Siparişinizi tamamlayın</p>
                    </div>
                    <CheckoutContent />
                </main>
            </div>
        </AuthGuard>
    )
}