import { useEffect, useState } from "react"
import { Banknote, Truck, Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSiteSettings } from "@/lib/site-settings-context"
import { toast } from "sonner"

type PaymentMethod = "CREDIT_CARD" | "EFT" | "CASH_ON_DELIVERY"

const bankTransferInfo = {
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || "",
    accountHolder: process.env.NEXT_PUBLIC_BANK_ACCOUNT_HOLDER || "",
    iban: process.env.NEXT_PUBLIC_BANK_IBAN || "",
}

interface PaymentMethodSelectorProps {
    paymentMethod: PaymentMethod
    onSelect: (method: PaymentMethod) => void
}

export function PaymentMethodSelector({ paymentMethod, onSelect }: PaymentMethodSelectorProps) {
    const settings = useSiteSettings()
    const [copied, setCopied] = useState(false)

    const paymentOptions = [
        ...(settings.bankTransferEnabled ? [{ value: "EFT" as const, label: "Havale / EFT", icon: Banknote, desc: "Banka transferi" }] : []),
        ...(settings.cashOnDeliveryEnabled ? [{ value: "CASH_ON_DELIVERY" as const, label: "Kapıda Ödeme", icon: Truck, desc: "Teslimat sırasında" }] : []),
    ]

    useEffect(() => {
        const availableMethods: PaymentMethod[] = [
            ...(settings.bankTransferEnabled ? ["EFT" as const] : []),
            ...(settings.cashOnDeliveryEnabled ? ["CASH_ON_DELIVERY" as const] : []),
        ]
        if (availableMethods.length > 0 && !availableMethods.includes(paymentMethod)) {
            onSelect(availableMethods[0])
        }
    }, [paymentMethod, onSelect, settings.bankTransferEnabled, settings.cashOnDeliveryEnabled])

    const handleCopyIban = () => {
        if (!bankTransferInfo.iban) return
        navigator.clipboard.writeText(bankTransferInfo.iban)
        setCopied(true)
        toast.success("IBAN başarıyla kopyalandı!")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10 rounded-[2px] shadow-[0_4px_24px_rgba(123,64,25,0.02)] transition-all duration-300">
            <CardHeader className="border-b border-primary/5 pb-4">
                <CardTitle className="font-cinzel text-lg tracking-wider text-primary flex items-center gap-2.5">
                    <Banknote className="h-4.5 w-4.5 text-primary/70" />
                    ÖDEME YÖNTEMİ
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    {paymentOptions.map((opt) => {
                        const isSelected = paymentMethod === opt.value
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onSelect(opt.value)}
                                className={`relative flex flex-col items-center justify-center rounded-[2px] border p-5 text-center transition-all duration-300 group cursor-pointer ${
                                    isSelected
                                        ? "border-primary bg-gradient-to-br from-amber-50/15 via-primary/[0.01] to-primary/[0.04] shadow-[0_8px_20px_rgba(123,64,25,0.06)]"
                                        : "border-primary/10 bg-background/40 hover:border-primary/45 hover:bg-background/80 hover:shadow-[0_4px_12px_rgba(123,64,25,0.03)] hover:-translate-y-0.5"
                                }`}
                            >
                                {/* Selection Seal Marker */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm animate-in zoom-in-50 duration-200">
                                        <Check className="h-2.5 w-2.5" />
                                    </div>
                                )}

                                <opt.icon className={`h-6 w-6 transition-transform duration-300 group-hover:scale-110 ${
                                    isSelected ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-primary"
                                }`} />
                                <p className="mt-3 font-serif text-sm font-semibold text-foreground">{opt.label}</p>
                                <p className="text-xxs text-muted-foreground/80 font-sans mt-0.5">{opt.desc}</p>
                            </button>
                        )
                    })}
                </div>

                {paymentMethod === "EFT" && (
                    <div className="mt-5 rounded-[2px] border border-dashed border-primary/20 bg-amber-50/[0.08] p-5 animate-in fade-in duration-300">
                        <p className="font-serif text-sm font-semibold text-primary border-b border-primary/10 pb-2 mb-4 tracking-wide uppercase">
                            Havale / EFT Bilgileri
                        </p>
                        {bankTransferInfo.iban ? (
                            <div className="space-y-3 text-sm">
                                {bankTransferInfo.bankName && (
                                    <div className="flex justify-between items-center gap-3 border-b border-primary/5 pb-2">
                                        <span className="text-muted-foreground font-sans">Banka</span>
                                        <span className="font-serif font-medium text-foreground">{bankTransferInfo.bankName}</span>
                                    </div>
                                )}
                                {bankTransferInfo.accountHolder && (
                                    <div className="flex justify-between items-center gap-3 border-b border-primary/5 pb-2">
                                        <span className="text-muted-foreground font-sans">Hesap Sahibi</span>
                                        <span className="font-serif font-medium text-foreground">{bankTransferInfo.accountHolder}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3 border-b border-primary/5 pb-2">
                                    <span className="text-muted-foreground font-sans">IBAN</span>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-primary hover:text-primary/80 transition-colors duration-200 cursor-pointer"
                                        onClick={handleCopyIban}
                                    >
                                        <span className="tracking-wide select-all">{bankTransferInfo.iban}</span>
                                        {copied ? <Check className="h-3.5 w-3.5 text-green-600 animate-in zoom-in" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                                <p className="pt-2 text-xxs text-muted-foreground/80 leading-relaxed font-sans italic">
                                    * Lütfen havale/EFT açıklama alanına sipariş numaranızı yazınız. Bu işlem ödeme eşleştirmenizi hızlandıracaktır.
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground leading-relaxed font-serif italic">
                                Banka hesap bilgileri henüz sisteme tanımlanmamıştır. Siparişinizi tamamladıktan sonra ödeme detayları için sizinle iletişime geçilecektir.
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
