import { useEffect } from "react"
import { CreditCard, Banknote, Truck, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSiteSettings } from "@/lib/site-settings-context"

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

    const paymentOptions = [
        ...(settings.creditCardEnabled ? [{ value: "CREDIT_CARD" as const, label: "Kredi Kartı", icon: CreditCard, desc: "Visa, Mastercard" }] : []),
        ...(settings.bankTransferEnabled ? [{ value: "EFT" as const, label: "Havale / EFT", icon: Banknote, desc: "Banka transferi" }] : []),
        ...(settings.cashOnDeliveryEnabled ? [{ value: "CASH_ON_DELIVERY" as const, label: "Kapıda Ödeme", icon: Truck, desc: "Teslimat sırasında" }] : []),
    ]

    useEffect(() => {
        const availableMethods: PaymentMethod[] = [
            ...(settings.creditCardEnabled ? ["CREDIT_CARD" as const] : []),
            ...(settings.bankTransferEnabled ? ["EFT" as const] : []),
            ...(settings.cashOnDeliveryEnabled ? ["CASH_ON_DELIVERY" as const] : []),
        ]
        if (availableMethods.length > 0 && !availableMethods.includes(paymentMethod)) {
            onSelect(availableMethods[0])
        }
    }, [paymentMethod, onSelect, settings.creditCardEnabled, settings.bankTransferEnabled, settings.cashOnDeliveryEnabled])

    return (
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
                            onClick={() => onSelect(opt.value)}
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

                {paymentMethod === "EFT" && (
                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <p className="font-serif text-sm font-semibold text-foreground">Havale / EFT Bilgileri</p>
                        {bankTransferInfo.iban ? (
                            <div className="mt-3 space-y-2 text-sm">
                                {bankTransferInfo.bankName && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Banka</span>
                                        <span className="text-right font-medium text-foreground">{bankTransferInfo.bankName}</span>
                                    </div>
                                )}
                                {bankTransferInfo.accountHolder && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Hesap Sahibi</span>
                                        <span className="text-right font-medium text-foreground">{bankTransferInfo.accountHolder}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted-foreground">IBAN</span>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 text-right font-mono text-sm font-medium text-foreground hover:text-primary"
                                        onClick={() => navigator.clipboard.writeText(bankTransferInfo.iban)}
                                    >
                                        {bankTransferInfo.iban}
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <p className="pt-2 text-xs text-muted-foreground">
                                    Açıklama alanına sipariş numaranızı yazmanız ödeme eşleştirmesini hızlandırır.
                                </p>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                                Banka hesap bilgileri henüz tanımlı değil. Siparişten sonra ödeme bilgileri için sizinle iletişime geçilecektir.
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
