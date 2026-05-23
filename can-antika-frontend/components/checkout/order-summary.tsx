import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Tag, X, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { CartResponse } from "@/lib/types"
import type { CouponState } from "@/hooks/useCoupon"

interface OrderSummaryProps {
    cart: CartResponse
    cartTotal: number
    itemCount: number
    coupon: CouponState
    shippingAmount: number
    finalTotal: number
    isPlacing: boolean
    selectedAddressId: number | null
    termsAccepted: boolean
    onTermsAcceptedChange: (accepted: boolean) => void
    onPlaceOrder: () => void
}

export function OrderSummary({
    cart,
    cartTotal,
    itemCount,
    coupon,
    shippingAmount,
    finalTotal,
    isPlacing,
    selectedAddressId,
    termsAccepted,
    onTermsAcceptedChange,
    onPlaceOrder,
}: OrderSummaryProps) {
    const [confirmOpen, setConfirmOpen] = useState(false)

    return (
        <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-[2px] border border-primary/15 bg-card/45 backdrop-blur-sm p-6 shadow-[0_8px_32px_rgba(123,64,25,0.02)]">
                <h3 className="font-cinzel text-base font-semibold tracking-wider text-primary mb-4 pb-3 border-b border-primary/10 uppercase">
                    SİPARİŞ ÖZETİ
                </h3>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/15 scrollbar-track-transparent">
                    {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 border-b border-primary/5 pb-3 last:border-b-0 last:pb-0">
                            <div className="h-12 w-12 rounded-[2px] border border-primary/5 overflow-hidden bg-background/50 relative shrink-0">
                                <Image
                                    src={item.product.imageUrls?.[0] || "/placeholder.svg"}
                                    alt={item.product.title}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-serif font-semibold text-foreground/90 truncate">{item.product.title}</p>
                                <p className="text-xxs text-muted-foreground/80 font-sans mt-0.5">{item.quantity} adet</p>
                            </div>
                            <p className="text-xs font-sans font-semibold text-foreground whitespace-nowrap pl-2">
                                ₺{item.total.toLocaleString("tr-TR")}
                            </p>
                        </div>
                    ))}
                </div>

                <Separator className="my-4 bg-primary/10" />

                {/* Kupon Alanı */}
                <div className="space-y-2">
                    <p className="text-xs font-serif font-semibold text-primary/80 flex items-center gap-1.5 uppercase tracking-wide">
                        <Tag className="h-3.5 w-3.5 text-primary/60" /> KUPON KODU
                    </p>
                    {coupon.appliedCoupon ? (
                        <div className="flex items-center justify-between rounded-[2px] bg-primary/5 border border-primary/15 px-3 py-2 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-mono font-semibold text-primary">{coupon.appliedCoupon}</span>
                            </div>
                            <button
                                onClick={coupon.handleRemoveCoupon}
                                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                placeholder="KUPON KODUNUZ"
                                value={coupon.couponCode}
                                onChange={(e) => coupon.setCouponCode(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && coupon.handleApplyCoupon()}
                                className="bg-background/40 text-xs font-mono uppercase tracking-wider rounded-[2px] border-primary/10 focus-visible:ring-0 focus-visible:border-primary/50"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={coupon.handleApplyCoupon}
                                disabled={coupon.isApplyingCoupon || !coupon.couponCode.trim()}
                                className="shrink-0 rounded-[2px] border-primary/20 text-primary font-serif hover:bg-primary/5 text-xs hover:border-primary"
                            >
                                {coupon.isApplyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Uygula"}
                            </Button>
                        </div>
                    )}
                </div>

                <Separator className="my-4 bg-primary/10" />

                <div className="space-y-2.5">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-sans">Ara Toplam ({itemCount} ürün)</span>
                        <span className="text-foreground font-sans font-semibold">₺{cartTotal.toLocaleString("tr-TR")}</span>
                    </div>
                    {coupon.discount > 0 && (
                        <div className="flex justify-between text-xs animate-in slide-in-from-top-1 duration-200">
                            <span className="text-primary font-sans font-medium">Kupon İndirimi</span>
                            <span className="text-primary font-sans font-semibold">-₺{coupon.discount.toLocaleString("tr-TR")}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-sans">Kargo</span>
                        <span className="text-foreground font-sans font-semibold">
                            {shippingAmount > 0 ? `₺${shippingAmount.toLocaleString("tr-TR")}` : "Ücretsiz"}
                        </span>
                    </div>
                </div>

                <Separator className="my-4 bg-primary/10" />

                <div className="flex justify-between items-baseline">
                    <span className="text-sm font-serif font-bold text-foreground uppercase tracking-wide">TOPLAM</span>
                    <span className="text-primary font-sans font-bold text-xl">₺{finalTotal.toLocaleString("tr-TR")}</span>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-[2px] border border-primary/10 bg-amber-50/[0.04] p-3.5">
                    <Checkbox
                        id="checkout-legal-approval"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => onTermsAcceptedChange(checked === true)}
                        className="mt-0.5 rounded-[2px] border-primary/30 text-primary focus:ring-primary/20"
                    />
                    <label htmlFor="checkout-legal-approval" className="text-[11px] leading-relaxed text-muted-foreground font-sans">
                        Aşağıdaki sözleşme ve formları, özellikle{" "}
                        <Link href="/on-bilgilendirme-formu" className="font-semibold text-primary underline underline-offset-2 hover:text-accent transition-colors" target="_blank">
                            Ön Bilgilendirme Formu
                        </Link>
                        {" "}ve{" "}
                        <Link href="/mesafeli-satis-sozlesmesi" className="font-semibold text-primary underline underline-offset-2 hover:text-accent transition-colors" target="_blank">
                            Mesafeli Satış Sözleşmesi
                        </Link>
                        {" "}metinlerini okudum, kabul ediyorum.
                    </label>
                </div>

                <Button
                    className="w-full mt-6 gap-2 text-primary-foreground font-serif tracking-wider font-semibold rounded-[2px] py-6 text-sm transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_16px_rgba(123,64,25,0.12)] hover:shadow-[0_6px_22px_rgba(123,64,25,0.22)] bg-gradient-to-r from-[#7B4019] via-[#8C4E23] to-[#7B4019] hover:from-[#8C4E23] hover:to-[#9C5E33] border-none outline-none cursor-pointer"
                    disabled={isPlacing || !selectedAddressId || !termsAccepted}
                    onClick={() => setConfirmOpen(true)}
                >
                    {isPlacing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                            Siparişiniz İşleniyor...
                        </>
                    ) : (
                        "SİPARİŞİ ONAYLA"
                    )}
                </Button>

                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent className="rounded-[2px] border-primary/15 bg-card/95 backdrop-blur-md max-w-md p-6">
                        <DialogHeader>
                            <DialogTitle className="font-cinzel text-lg text-primary tracking-wide">Siparişi Onaylıyor musunuz?</DialogTitle>
                            <DialogDescription className="font-sans text-sm text-foreground/80 leading-relaxed mt-2">
                                Siparişiniz oluşturulacak ve ödeme durumu ödeme kontrolü tamamlanana kadar beklemede kalacaktır.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-6 gap-2 sm:gap-0">
                            <Button 
                                variant="outline" 
                                onClick={() => setConfirmOpen(false)} 
                                disabled={isPlacing}
                                className="rounded-[2px] border-primary/20 font-serif text-foreground hover:bg-primary/5 cursor-pointer"
                            >
                                Vazgeç
                            </Button>
                            <Button
                                onClick={() => {
                                    setConfirmOpen(false)
                                    onPlaceOrder()
                                }}
                                disabled={isPlacing}
                                className="rounded-[2px] bg-primary hover:bg-primary/95 text-primary-foreground font-serif tracking-wide shadow-md cursor-pointer"
                            >
                                Evet, Onayla
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Link href="/sepet" className="block mt-3">
                    <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary font-serif text-xs rounded-[2px] cursor-pointer">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Sepete Dön
                    </Button>
                </Link>
            </div>
        </div>
    )
}
