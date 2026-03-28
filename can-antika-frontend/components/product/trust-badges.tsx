import { memo } from "react"
import { Shield, Truck, RotateCcw } from "lucide-react"

export const TrustBadges = memo(function TrustBadges() {
    return (
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">Uzman Onaylı</p>
                    <p className="text-xs text-muted-foreground">Sertifikalı</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">Güvenli Kargo</p>
                    <p className="text-xs text-muted-foreground">Sigortalı</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <RotateCcw className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">14 Gün İade</p>
                    <p className="text-xs text-muted-foreground">Koşulsuz</p>
                </div>
            </div>
        </div>
    )
})
