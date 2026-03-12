import { useState } from "react"
import { XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { orderApi } from "@/lib/api"
import type { OrderResponse } from "@/lib/types"
import { toast } from "sonner"

interface CancelOrderButtonProps {
    order: OrderResponse
    onCancelled: (updated: OrderResponse) => void
}

export function CancelOrderButton({ order, onCancelled }: CancelOrderButtonProps) {
    const [isCancelling, setIsCancelling] = useState(false)

    if (order.orderStatus !== "PENDING" && order.orderStatus !== "PAID") return null

    const handleCancel = async () => {
        if (!confirm("Siparişi iptal etmek istediğinize emin misiniz?")) return
        setIsCancelling(true)
        try {
            const updated = await orderApi.cancelOrder(order.id)
            onCancelled(updated)
            toast.success("Sipariş iptal edildi")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Sipariş iptal edilemedi")
        } finally {
            setIsCancelling(false)
        }
    }

    return (
        <Button variant="destructive" className="w-full" disabled={isCancelling} onClick={handleCancel}>
            {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            {isCancelling ? "İptal Ediliyor..." : "Siparişi İptal Et"}
        </Button>
    )
}
