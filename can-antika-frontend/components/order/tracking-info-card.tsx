import { Truck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTrackingUrl, isNoParamCarrier } from "@/lib/commerce/carrier-tracking"
import type { OrderResponse } from "@/lib/types"
import { toast } from "sonner"

interface TrackingInfoCardProps {
    order: OrderResponse
}

export function TrackingInfoCard({ order }: TrackingInfoCardProps) {
    if (!order.trackingNumber && !order.carrierName) return null

    const trackingUrl = order.trackingNumber
        ? getTrackingUrl(order.carrierName, order.trackingNumber)
        : null
    const isNoParam = isNoParamCarrier(order.carrierName)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                    <Truck className="h-5 w-5" /> Kargo Bilgileri
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    {order.carrierName && (
                        <div>
                            <p className="text-sm text-muted-foreground">Kargo Firması</p>
                            <p className="font-medium text-foreground">{order.carrierName}</p>
                        </div>
                    )}
                    {order.trackingNumber && (
                        <div>
                            <p className="text-sm text-muted-foreground">Takip Numarası</p>
                            <p className="font-medium text-foreground font-mono">{order.trackingNumber}</p>
                        </div>
                    )}
                </div>
                {order.trackingNumber && trackingUrl ? (
                    <div className="space-y-2">
                        {isNoParam && (
                            <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
                                <p className="text-xs text-amber-800">
                                    Takip kodunuzu kopyalayıp açılan sayfaya yapıştırın:{" "}
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(order.trackingNumber!)
                                            toast("Kargo kodu kopyalandı")
                                        }}
                                        className="font-mono font-bold underline cursor-pointer"
                                    >
                                        {order.trackingNumber}
                                    </button>
                                </p>
                            </div>
                        )}
                        <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            <Truck className="h-4 w-4" />
                            Kargonu Takip Et
                        </a>
                    </div>
                ) : order.trackingNumber ? (
                    <p className="text-sm text-muted-foreground">
                        Kargo takibi için <strong>{order.carrierName}</strong> web sitesini ziyaret edip{" "}
                        <strong className="font-mono">{order.trackingNumber}</strong> kodunu girebilirsiniz.
                    </p>
                ) : null}
            </CardContent>
        </Card>
    )
}
