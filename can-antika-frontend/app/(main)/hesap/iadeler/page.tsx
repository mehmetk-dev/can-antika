"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { orderReturnApi } from "@/lib/api"
import { getReturnStatus } from "@/lib/commerce/order-utils"
import type { OrderReturnResponse } from "@/lib/types"
import { formatDateTR } from "@/lib/utils"

export default function AccountReturnsPage() {
    const [returns, setReturns] = useState<OrderReturnResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        orderReturnApi
            .getMyReturns()
            .then(setReturns)
            .catch(() => setReturns([]))
            .finally(() => setIsLoading(false))
    }, [])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">İade talepleri yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">İadelerim</h1>
                <p className="mt-2 text-muted-foreground">İade taleplerinizi ve güncel durumlarını takip edin.</p>
            </div>

            {returns.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <RotateCcw className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-medium text-foreground">İade talebiniz yok</p>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Teslim edilen siparişlerinizin detay sayfasından iade talebi oluşturabilirsiniz.
                        </p>
                        <Link href="/hesap/siparisler">
                            <Button variant="outline" className="mt-6">Siparişlerime Git</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {returns.map((item) => {
                        const status = getReturnStatus(item.status)
                        return (
                            <Card key={item.id}>
                                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <p className="font-medium text-foreground">İade #{item.id}</p>
                                            <Badge variant={status.variant} className={status.className}>
                                                {status.label}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Sipariş #{item.orderId} · {formatDateTR(item.createdAt, "compact")}
                                        </p>
                                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.reason}</p>
                                    </div>
                                    <Link href={`/hesap/siparisler/${item.orderId}`} className="shrink-0">
                                        <Button variant="outline">Siparişi Gör</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
