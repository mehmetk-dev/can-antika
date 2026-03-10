"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Plus, CreditCard, Banknote, Truck, Loader2, CheckCircle, Tag, X } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AuthGuard } from "@/components/auth-guard"
import { cartApi, addressApi, orderApi } from "@/lib/api"
import { useSiteSettings } from "@/lib/site-settings-context"
import { toast } from "sonner"
import type { CartResponse, AddressResponse } from "@/lib/types"

function CheckoutContent() {
    const router = useRouter()
    const settings = useSiteSettings()
    const [cart, setCart] = useState<CartResponse | null>(null)
    const [addresses, setAddresses] = useState<AddressResponse[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "EFT" | "CASH_ON_DELIVERY">("CREDIT_CARD")
    const [note, setNote] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isPlacing, setIsPlacing] = useState(false)
    const [orderPlaced, setOrderPlaced] = useState(false)
    const [orderId, setOrderId] = useState<number | null>(null)
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
    const [discount, setDiscount] = useState(0)
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

    useEffect(() => {
        Promise.all([
            cartApi.getCart().catch(() => null),
            addressApi.getMyAddresses().catch(() => []),
        ]).then(([cartData, addressData]) => {
            setCart(cartData)
            setAddresses(addressData)
            if (addressData.length > 0) setSelectedAddressId(addressData[0].id)
            setIsLoading(false)
        })
    }, [])

    const cartTotal = cart?.items?.reduce((sum, item) => sum + item.total, 0) ?? 0
    const itemCount = cart?.items?.length ?? 0
    const finalTotal = Math.max(0, cartTotal - discount)

    const paymentOptions = [
        ...(settings.creditCardEnabled ? [{ value: "CREDIT_CARD" as const, label: "Kredi Kartı", icon: CreditCard, desc: "Visa, Mastercard" }] : []),
        ...(settings.bankTransferEnabled ? [{ value: "EFT" as const, label: "Havale / EFT", icon: Banknote, desc: "Banka transferi" }] : []),
        ...(settings.cashOnDeliveryEnabled ? [{ value: "CASH_ON_DELIVERY" as const, label: "Kapıda Ödeme", icon: Truck, desc: "Teslimat sırasında" }] : []),
    ]

    // Seçili yöntem kapatılırsa ilk mevcut yönteme geç
    useEffect(() => {
        const availableMethods = [
            ...(settings.creditCardEnabled ? ["CREDIT_CARD" as const] : []),
            ...(settings.bankTransferEnabled ? ["EFT" as const] : []),
            ...(settings.cashOnDeliveryEnabled ? ["CASH_ON_DELIVERY" as const] : []),
        ]

        if (availableMethods.length > 0 && !availableMethods.includes(paymentMethod)) {
            setPaymentMethod(availableMethods[0])
        }
    }, [paymentMethod, settings.creditCardEnabled, settings.bankTransferEnabled, settings.cashOnDeliveryEnabled])

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return
        setIsApplyingCoupon(true)
        try {
            const result = await cartApi.applyCoupon(couponCode.trim())
            const newTotal = result?.items?.reduce((sum: number, item: { total: number }) => sum + item.total, 0) ?? cartTotal
            const diff = cartTotal - newTotal
            if (diff > 0) {
                setDiscount(diff)
                setAppliedCoupon(couponCode.trim().toUpperCase())
                setCouponCode("")
                toast.success(`Kupon uygulandı! ₺${diff.toLocaleString("tr-TR")} indirim`)
            } else {
                setAppliedCoupon(couponCode.trim().toUpperCase())
                setDiscount(0)
                setCouponCode("")
                toast.success("Kupon uygulandı")
            }
        } catch {
            toast.error("Geçersiz kupon kodu")
        } finally {
            setIsApplyingCoupon(false)
        }
    }

    const handleRemoveCoupon = async () => {
        try {
            await cartApi.removeCoupon()
            setAppliedCoupon(null)
            setDiscount(0)
            toast.success("Kupon kaldırıldı")
        } catch {
            toast.error("Kupon kaldırılamadı")
        }
    }

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

    if (orderPlaced) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
                    <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h2 className="font-serif text-3xl font-semibold text-foreground">Siparişiniz Alındı!</h2>
                <p className="mt-3 text-muted-foreground max-w-md">
                    Sipariş numaranız: <span className="font-semibold text-foreground">#{orderId}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Siparişinizin durumunu hesabınızdan takip edebilirsiniz.
                </p>
                <div className="mt-8 flex gap-3">
                    <Link href="/hesap/siparisler">
                        <Button>Siparişlerim</Button>
                    </Link>
                    <Link href="/urunler">
                        <Button variant="outline">Alışverişe Devam Et</Button>
                    </Link>
                </div>
            </div>
        )
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
            {/* Left — Steps */}
            <div className="lg:col-span-2 space-y-6">
                {/* Address Selection */}
                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle className="font-serif flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Teslimat Adresi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {addresses.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-muted-foreground mb-3">Kayıtlı adresiniz yok</p>
                                <Link href="/hesap/adresler">
                                    <Button variant="outline" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Adres Ekle
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {addresses.map((addr) => (
                                    <button
                                        key={addr.id}
                                        type="button"
                                        onClick={() => setSelectedAddressId(addr.id)}
                                        className={`rounded-lg border p-4 text-left transition-all ${selectedAddressId === addr.id
                                            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <p className="font-medium text-foreground">{addr.title}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">{addr.addressLine}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {addr.district}, {addr.city} {addr.postalCode}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle className="font-serif flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Ödeme Yöntemi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {paymentOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPaymentMethod(opt.value)}
                                    className={`flex flex-col items-center rounded-lg border p-4 transition-all ${paymentMethod === opt.value
                                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <opt.icon className={`h-6 w-6 ${paymentMethod === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                                    <p className="mt-2 text-sm font-medium text-foreground">{opt.label}</p>
                                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Note */}
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

            {/* Right — Summary */}
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
                        {appliedCoupon ? (
                            <div className="flex items-center justify-between rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-sm font-medium text-primary">{appliedCoupon}</span>
                                </div>
                                <button
                                    onClick={handleRemoveCoupon}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Kupon kodunuz"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                                    className="bg-muted/50 text-sm uppercase"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleApplyCoupon}
                                    disabled={isApplyingCoupon || !couponCode.trim()}
                                    className="shrink-0"
                                >
                                    {isApplyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Uygula"}
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
                        {discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-primary">Kupon İndirimi</span>
                                <span className="text-primary">-₺{discount.toLocaleString("tr-TR")}</span>
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
                        onClick={handlePlaceOrder}
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
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-background">
                <Header />
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                    <div className="mb-8">
                        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Sipariş</h1>
                        <p className="mt-1 text-muted-foreground">Siparişinizi tamamlayın</p>
                    </div>
                    <CheckoutContent />
                </main>
                <Footer />
            </div>
        </AuthGuard>
    )
}
