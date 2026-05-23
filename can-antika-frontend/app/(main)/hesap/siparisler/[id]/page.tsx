"use client"

import Image from "next/image"
import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Package, MapPin, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { orderApi, orderReturnApi } from "@/lib/api"
import type { OrderResponse, OrderReturnResponse } from "@/lib/types"
import { toast } from "sonner"
import { useSiteSettings } from "@/lib/site-settings-context"
import { generateInvoiceHtml } from "@/lib/commerce/invoice-template"
import { formatShippingAmount } from "@/lib/commerce/shipping"
import { TrackingInfoCard } from "@/components/order/tracking-info-card"
import { ReturnRequestDialog } from "@/components/order/return-request-dialog"
import { CancelOrderButton } from "@/components/order/cancel-order-button"
import { getOrderStatus, getReturnStatus } from "@/lib/commerce/order-utils"
import { getProductUrl } from "@/lib/product/product-url"
import { formatDateTR } from "@/lib/utils"

function OrderDetailContent({ orderId }: { orderId: number }) {
    const [order, setOrder] = useState<OrderResponse | null>(null)
    const [orderReturn, setOrderReturn] = useState<OrderReturnResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const settings = useSiteSettings()

    useEffect(() => {
        Promise.allSettled([
            orderApi.getMyOrderById(orderId),
            orderReturnApi.getMyReturns(),
        ])
            .then(([orderResult, returnsResult]) => {
                if (orderResult.status === "fulfilled") {
                    setOrder(orderResult.value)
                } else {
                    setOrder(null)
                }

                if (returnsResult.status === "fulfilled") {
                    const existingReturn = returnsResult.value.find((item) => item.orderId === orderId) ?? null
                    setOrderReturn(existingReturn)
                }
            })
            .finally(() => setIsLoading(false))
    }, [orderId])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Sipariş yükleniyor...</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Package className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium text-foreground">Sipariş bulunamadı</p>
                <Link href="/hesap/siparisler">
                    <Button variant="outline" className="mt-4">Siparişlere Dön</Button>
                </Link>
            </div>
        )
    }

    const status = getOrderStatus(order.orderStatus)
    const returnStatus = orderReturn ? getReturnStatus(orderReturn.status) : null
    const hasActiveReturn = orderReturn?.status === "PENDING" || orderReturn?.status === "APPROVED"
    const shippingAmount = order.shippingAmount ?? 0
    const subtotalAmount = Math.max(order.totalAmount - shippingAmount, 0)

    const handleInvoice = async () => {
        try {
            const invoice = await orderApi.getInvoice(order.id)
            const html = generateInvoiceHtml(invoice, {
                address: settings?.address,
                phone: settings?.phone,
            })
            // Use Blob URL instead of document.write to prevent XSS
            const blob = new Blob([html], { type: "text/html;charset=utf-8" })
            const url = URL.createObjectURL(blob)
            const w = window.open(url, "_blank")
            // Revoke after a delay to ensure the tab has loaded
            if (w) {
                setTimeout(() => URL.revokeObjectURL(url), 10_000)
            } else {
                URL.revokeObjectURL(url)
                toast.error("Açılır pencere engellenmiş olabilir")
            }
        } catch {
            toast.error("Fatura yüklenemedi")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/hesap/siparisler">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div className="flex-1">
                    <h1 className="font-serif text-2xl font-semibold text-foreground">
                        Sipariş #{order.id.toString().padStart(4, "0")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {formatDateTR(order.orderDate)}
                    </p>
                </div>
                <Badge className={status.className}>{status.label}</Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif flex items-center gap-2">
                                <Package className="h-5 w-5" /> Ürünler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.orderItems.map((item, i) => {
                                const imageUrl = item.product?.imageUrls?.[0] || item.imageUrls?.[0]
                                const itemTitle = item.title || item.product?.title || "Ürün"

                                return (
                                <div key={`${item.id}-${i}`} className="flex gap-4">
                                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                                        {imageUrl ? (
                                            <Image src={imageUrl} alt={itemTitle} fill sizes="80px" className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                <Package className="h-6 w-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {item.product ? (
                                            <Link href={getProductUrl(item.product)} className="font-medium text-foreground hover:text-primary line-clamp-1">
                                                {itemTitle}
                                            </Link>
                                        ) : (
                                            <p className="font-medium text-foreground line-clamp-1">
                                                {itemTitle}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">Adet: {item.quantity}</p>
                                        {!item.product && (
                                            <p className="text-xs text-muted-foreground">Ürün artık yayında değil</p>
                                        )}
                                        <p className="font-medium text-primary mt-1">₺{item.price.toLocaleString("tr-TR")}</p>
                                    </div>
                                </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    <TrackingInfoCard order={order} />
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Özet
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Ara Toplam</span>
                                <span className="text-foreground">₺{subtotalAmount.toLocaleString("tr-TR")}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Kargo</span>
                                <span className={shippingAmount > 0 ? "text-foreground" : "text-green-600"}>
                                    {formatShippingAmount(shippingAmount)}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium">
                                <span className="text-foreground">Toplam</span>
                                <span className="text-primary text-lg">₺{order.totalAmount.toLocaleString("tr-TR")}</span>
                            </div>
                            {order.paymentStatus && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ödeme</span>
                                    <Badge variant="outline">{order.paymentStatus === "PAID" ? "Ödendi" : order.paymentStatus}</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Address */}
                    {order.shippingAddress && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-serif flex items-center gap-2">
                                    <MapPin className="h-5 w-5" /> Teslimat Adresi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-medium text-foreground">{order.shippingAddress.title}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{order.shippingAddress.addressLine}</p>
                                <p className="text-sm text-muted-foreground">
                                    {[order.shippingAddress.neighborhood, order.shippingAddress.district, order.shippingAddress.city].filter(Boolean).join(", ")} {order.shippingAddress.postalCode}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Button variant="outline" className="w-full" onClick={handleInvoice}>
                        <FileText className="mr-2 h-4 w-4" />
                        Fatura / PDF
                    </Button>

                    <CancelOrderButton order={order} onCancelled={setOrder} />

                    {orderReturn && returnStatus && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-serif text-base">İade Talebi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Badge variant={returnStatus.variant} className={returnStatus.className}>
                                    {returnStatus.label}
                                </Badge>
                                <p className="text-sm text-muted-foreground">{orderReturn.reason}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDateTR(orderReturn.createdAt, "compact")}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {order.orderStatus === "DELIVERED" && !hasActiveReturn && (
                        <ReturnRequestDialog orderId={order.id} onCreated={setOrderReturn} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <OrderDetailContent orderId={Number(id)} />
}
