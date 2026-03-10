"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, Package } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AuthGuard } from "@/components/auth-guard"
import { orderApi } from "@/lib/api"
import type { OrderResponse } from "@/lib/types"

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  DELIVERED: { label: "Teslim Edildi", variant: "default" },
  SHIPPED: { label: "Kargoda", variant: "secondary" },
  PENDING: { label: "Hazırlanıyor", variant: "outline" },
  PAID: { label: "Ödendi", variant: "default" },
  CANCELLED: { label: "İptal Edildi", variant: "outline" },
}

function OrdersContent() {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    orderApi
      .getMyOrders(page, 10)
      .then((data) => {
        setOrders(data.items)
        setTotalPages(Math.ceil(data.totalElement / 10))
      })
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false))
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
      return new Date(dateStr).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => {
          const statusInfo = statusLabels[order.orderStatus] || { label: order.orderStatus, variant: "outline" as const }

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
                        <div className="h-16 w-16 overflow-hidden rounded-md bg-muted shrink-0">
                          <img
                            src={imageUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} adet × ₺{item.price.toLocaleString("tr-TR")}
                          </p>
                        </div>
                        {item.product && (
                          <Link href={`/urun/${item.product.slug ?? item.product.id}`}>
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
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <DashboardSidebar />
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Siparişlerim</h1>
                <p className="mt-2 text-muted-foreground">Geçmiş siparişlerinizi görüntüleyin</p>
              </div>
              <OrdersContent />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  )
}
