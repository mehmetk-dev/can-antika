import { useEffect } from "react"
import { CreditCard, Banknote, Truck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSiteSettings } from "@/lib/site-settings-context"

type PaymentMethod = "CREDIT_CARD" | "EFT" | "CASH_ON_DELIVERY"

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
            </CardContent>
        </Card>
    )
}
