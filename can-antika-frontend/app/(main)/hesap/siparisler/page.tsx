"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { orderApi } from "@/lib/api"
import type { OrderResponse } from "@/lib/types"
import { getOrderStatus } from "@/lib/commerce/order-utils"
import { getProductUrl } from "@/lib/product/product-url"
import { formatDateTR } from "@/lib/utils"

function OrdersContent() {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsLoading(true), 0)
    orderApi
      .getMyOrders(page, 10)
      .then((data) => {
        setOrders(data.items)
        setTotalPages(Math.ceil(data.totalElement / 10))
      })
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false))

    return () => clearTimeout(loadingTimer)
  }, [page])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Siparişler yükleniyor...</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-serif text-xl text-foreground">Henüz siparişiniz yok</p>
        <p className="mt-2 text-muted-foreground">Koleksiyonumuza göz atarak ilk siparişinizi verin</p>
        <Link href="/urunler">
          <Button className="mt-4 bg-primary text-primary-foreground">Alışverişe Başla</Button>
        </Link>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    try {
      return formatDateTR(dateStr)
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => {
          const statusInfo = getOrderStatus(order.orderStatus)

          return (
            <Card key={order.id} className="bg-card">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-foreground">Sipariş #{order.id}</p>
                      <Badge
                        variant={statusInfo.variant}
                        className={
                          order.orderStatus === "DELIVERED" || order.orderStatus === "PAID"
                            ? "bg-primary text-primary-foreground"
                            : order.orderStatus === "SHIPPED"
                              ? "bg-accent text-accent-foreground"
                              : order.orderStatus === "CANCELLED"
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-transparent"
                        }
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.orderDate)}</p>
                    {order.trackingNumber && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Takip: {order.trackingNumber} ({order.carrierName})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-serif text-lg font-semibold text-primary">
                      ₺{order.totalAmount.toLocaleString("tr-TR")}
                    </p>
                    <Link href={`/hesap/siparisler/${order.id}`}>
                      <Button variant="outline" size="sm" className="bg-transparent">Sipariş Detayı</Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  {order.orderItems.map((item, i) => {
                    const imageUrl = item.product?.imageUrls?.[0] || "/placeholder.svg"
                    return (
                      <div key={`${item.id}-${i}`} className="flex items-center gap-4 mb-3 last:mb-0">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted shrink-0">
                          <Image
                            src={imageUrl}
                            alt={item.title || item.product?.title || "Ürün"}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.title || item.product?.title || "Ürün"}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} adet × ₺{item.price.toLocaleString("tr-TR")}
                          </p>
                        </div>
                        {item.product && (
                          <Link href={getProductUrl(item.product)}>
                            <Button variant="outline" size="sm" className="bg-transparent">
                              Detay
                            </Button>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Önceki
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Sonraki
          </Button>
        </div>
      )}
    </>
  )
}

export default function OrdersPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Siparişlerim</h1>
        <p className="mt-2 text-muted-foreground">Geçmiş siparişlerinizi görüntüleyin</p>
      </div>
      <OrdersContent />
    </>
  )
}