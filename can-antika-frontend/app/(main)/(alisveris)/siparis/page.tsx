"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AuthGuard } from "@/components/auth/auth-guard"
import { cartApi, orderApi, paymentApi } from "@/lib/api"
import { toast } from "sonner"
import { useCheckoutData } from "@/hooks/useCheckoutData"
import { useCoupon } from "@/hooks/useCoupon"
import { AddressSelector } from "@/components/checkout/address-selector"
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector"
import { OrderSummary } from "@/components/checkout/order-summary"
import { OrderConfirmation } from "@/components/checkout/order-confirmation"
import { LegalDocumentsPanel } from "@/components/checkout/legal-documents-panel"
import { useSiteSettings } from "@/lib/site-settings-context"
import { calculateShippingAmount } from "@/lib/commerce/shipping"

function CheckoutContent() {
    const router = useRouter()
    const settings = useSiteSettings()
    const {
        cart, setCart, addresses, selectedAddressId, setSelectedAddressId,
        note, setNote, isLoading, cartTotal, itemCount,
    } = useCheckoutData()

    const coupon = useCoupon(cart, setCart)
    const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "EFT" | "CASH_ON_DELIVERY">("EFT")
    const [isPlacing, setIsPlacing] = useState(false)
    const [orderPlaced, setOrderPlaced] = useState(false)
    const [orderId, setOrderId] = useState<number | null>(null)
    const [paytrIframeUrl, setPaytrIframeUrl] = useState<string | null>(null)
    const [termsAccepted, setTermsAccepted] = useState(false)

    const payableSubtotal = Math.max(0, cartTotal - coupon.discount)
    const shippingAmount = calculateShippingAmount(payableSubtotal, settings)
    const finalTotal = payableSubtotal + shippingAmount
    const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null

    const handlePlaceOrder = async () => {
        if (!termsAccepted) {
            toast.error("Lütfen ön bilgilendirme formunu ve mesafeli satış sözleşmesini onaylayın")
            return
        }
        if (!selectedAddressId) {
            toast.error("Lütfen teslimat adresi seçin")
            return
        }
        const hasIncompleteAddress = !selectedAddress ||
            !selectedAddress.title?.trim() ||
            !selectedAddress.country?.trim() ||
            !selectedAddress.city?.trim() ||
            !selectedAddress.district?.trim() ||
            !selectedAddress.neighborhood?.trim() ||
            !selectedAddress.phone?.trim() ||
            !selectedAddress.postalCode?.trim() ||
            !selectedAddress.addressLine?.trim()
        if (hasIncompleteAddress) {
            toast.error("Teslimat adresiniz eksik. Lütfen adres ve telefon bilgilerinizi güncelleyin.")
            return
        }

        setIsPlacing(true)
        try {
            const latestCart = await cartApi.getCart()
            const latestItems = latestCart?.items ?? []
            const currentItems = cart?.items ?? []
            const cartChanged =
                latestItems.length !== currentItems.length ||
                latestItems.some((item) => {
                    const current = currentItems.find((currentItem) => currentItem.product.id === item.product.id)
                    return !current ||
                        current.quantity !== item.quantity ||
                        current.price !== item.price ||
                        current.total !== item.total ||
                        current.product.stock !== item.product.stock
                })

            if (latestItems.length === 0) {
                setCart(latestCart)
                toast.error("Sepetiniz boş veya ürünler artık satışta değil.")
                return
            }

            if (cartChanged) {
                setCart(latestCart)
                toast.info("Sepetiniz güncellendi. Lütfen fiyat ve stok bilgilerini kontrol edip tekrar onaylayın.")
                return
            }

            const order = await orderApi.createOrder({
                addressId: selectedAddressId,
                note: note || undefined,
                paymentStatus: "PENDING",
            })
            // Sipariş sonrası sepet badge'ini sıfırla
            if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"))
            setOrderId(order.id)
            if (paymentMethod === "CREDIT_CARD") {
                const paytr = await paymentApi.initializePaytr(order.id)
                setPaytrIframeUrl(paytr.iframeUrl)
                toast.success("Güvenli ödeme formu hazırlandı.")
                return
            }
            setOrderPlaced(true)
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
                <p className="mt-4 text-muted-foreground font-serif italic text-sm">Sipariş verileri yükleniyor...</p>
            </div>
        )
    }

    if (paytrIframeUrl && orderId) {
        return (
            <div className="space-y-5">
                <div className="rounded-[2px] border border-primary/10 bg-card/40 p-4">
                    <p className="font-cinzel text-base tracking-wider text-primary">GÜVENLİ KART ÖDEMESİ</p>
                    <p className="mt-1 text-xs text-muted-foreground font-sans">
                        Sipariş numaranız #{orderId}. Ödeme sonucu PayTR tarafından otomatik olarak bildirilecektir.
                    </p>
                </div>
                <iframe
                    src={paytrIframeUrl}
                    title={`PayTR Ödeme Formu - Sipariş #${orderId}`}
                    className="h-[760px] w-full rounded-[2px] border border-primary/15 bg-background"
                    allow="payment *"
                />
            </div>
        )
    }

    if (orderPlaced && orderId) {
        return <OrderConfirmation orderId={orderId} />
    }

    if (!cart || itemCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto">
                <p className="font-cinzel text-xl text-primary tracking-wide">SEPETİNİZ BOŞ</p>
                <p className="mt-3 text-muted-foreground text-sm font-sans leading-relaxed">Sipariş verebilmek için önce sepetinize değerli bir antika parça eklemelisiniz.</p>
                <Link href="/urunler" className="mt-8">
                    <Button className="rounded-[2px] px-8 py-5 text-sm font-serif tracking-wider font-semibold shadow-md bg-primary hover:bg-primary/95 text-primary-foreground cursor-pointer">
                        Koleksiyonu Keşfet
                    </Button>
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

                <LegalDocumentsPanel
                    selectedAddress={selectedAddress}
                    cartTotal={cartTotal}
                    shippingAmount={shippingAmount}
                    finalTotal={finalTotal}
                />

                {/* Sipariş Notu */}
                <Card className="bg-card/40 backdrop-blur-sm border-primary/10 rounded-[2px] shadow-[0_4px_24px_rgba(123,64,25,0.02)] transition-all duration-300">
                    <CardHeader className="border-b border-primary/5 pb-4">
                        <CardTitle className="font-cinzel text-lg tracking-wider text-primary flex items-center gap-2.5">
                            <PenTool className="h-4.5 w-4.5 text-primary/70" />
                            SİPARİŞ NOTU
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Textarea
                            placeholder="Siparişiniz veya teslimatınız hakkında eklemek istediğiniz özel bir not var mı? (opsiyonel)..."
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="bg-background/40 border-primary/10 focus-visible:ring-0 focus-visible:border-primary/40 rounded-[2px] text-sm p-4 leading-relaxed font-sans placeholder:text-muted-foreground/50 transition-all duration-300"
                        />
                    </CardContent>
                </Card>
            </div>

            <OrderSummary
                cart={cart}
                cartTotal={cartTotal}
                itemCount={itemCount}
                coupon={coupon}
                shippingAmount={shippingAmount}
                finalTotal={finalTotal}
                isPlacing={isPlacing}
                selectedAddressId={selectedAddressId}
                termsAccepted={termsAccepted}
                onTermsAcceptedChange={setTermsAccepted}
                onPlaceOrder={handlePlaceOrder}
            />
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <AuthGuard>
            <div className="bg-background min-h-screen">
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                    <div className="mb-8 max-w-md">
                        <h1 className="font-cinzel text-3xl font-semibold tracking-wider text-primary uppercase">ÖDEME</h1>
                        <p className="mt-1.5 text-muted-foreground text-xs font-serif italic tracking-wide">Siparişinizi tamamlayın ve eserinizi güvenceye alın</p>
                        <div className="flex items-center gap-3 mt-3">
                            <div className="h-[1px] bg-primary/20 flex-1" />
                            <span className="text-primary/30 text-xxs tracking-widest">◆</span>
                            <div className="h-[1px] bg-primary/20 flex-1" />
                        </div>
                    </div>
                    <CheckoutContent />
                </main>
            </div>
        </AuthGuard>
    )
}
