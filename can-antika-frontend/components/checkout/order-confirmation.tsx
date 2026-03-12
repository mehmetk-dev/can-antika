import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrderConfirmationProps {
    orderId: number
}

export function OrderConfirmation({ orderId }: OrderConfirmationProps) {
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
