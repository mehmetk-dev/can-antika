"use client"

import Image from "next/image"
import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Package, Truck, MapPin, FileText, XCircle, RotateCcw } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AuthGuard } from "@/components/auth-guard"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { orderApi, orderReturnApi } from "@/lib/api"
import type { OrderResponse } from "@/lib/types"
import { toast } from "sonner"
import { useSiteSettings } from "@/lib/site-settings-context"

const statusLabels: Record<string, { label: string; color: string }> = {
    DELIVERED: { label: "Teslim Edildi", color: "bg-green-100 text-green-800" },
    SHIPPED: { label: "Kargoda", color: "bg-blue-100 text-blue-800" },
    PENDING: { label: "Hazırlanıyor", color: "bg-amber-100 text-amber-800" },
    PAID: { label: "Ödendi", color: "bg-emerald-100 text-emerald-800" },
    CANCELLED: { label: "İptal Edildi", color: "bg-red-100 text-red-800" },
}

function OrderDetailContent({ orderId }: { orderId: number }) {
    const [order, setOrder] = useState<OrderResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const settings = useSiteSettings()
    const [isCancelling, setIsCancelling] = useState(false)
    const [returnReason, setReturnReason] = useState("")
    const [isReturning, setIsReturning] = useState(false)
    const [returnDialogOpen, setReturnDialogOpen] = useState(false)

    useEffect(() => {
        orderApi
            .getMyOrderById(orderId)
            .then((found) => setOrder(found))
            .catch(() => setOrder(null))
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

    const status = statusLabels[order.orderStatus] || { label: order.orderStatus, color: "bg-muted text-muted-foreground" }

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
                        {new Date(order.orderDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>
                <Badge className={status.color}>{status.label}</Badge>
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
                            {order.orderItems.map((item, i) => (
                                <div key={`${item.id}-${i}`} className="flex gap-4">
                                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                                        {item.product?.imageUrls?.[0] ? (
                                            <Image src={item.product.imageUrls[0]} alt={item.title} fill sizes="80px" className="object-cover" unoptimized />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                <Package className="h-6 w-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/urun/${item.product?.slug ?? item.product?.id ?? ""}`} className="font-medium text-foreground hover:text-primary line-clamp-1">
                                            {item.title}
                                        </Link>
                                        <p className="text-sm text-muted-foreground">Adet: {item.quantity}</p>
                                        <p className="font-medium text-primary mt-1">₺{item.price.toLocaleString("tr-TR")}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Tracking */}
                    {(order.trackingNumber || order.carrierName) && (
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
                                {order.trackingNumber && (() => {
                                    const carrierTrackingUrls: Record<string, (code: string) => string> = {
                                        "Yurtiçi Kargo": (c) => `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${c}`,
                                        "Aras Kargo": () => `https://araskargo.com.tr/kargo-takip`,
                                        "MNG Kargo": () => `https://www.mngkargo.com.tr/gonderitakip`,
                                        "Sürat Kargo": (c) => `https://suratkargo.com.tr/KargoTakip/?kargotakipno=${c}`,
                                        "PTT Kargo": (c) => `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${c}`,
                                        "UPS": (c) => `https://www.ups.com/track?tracknum=${c}&loc=tr_TR`,
                                        "DHL": (c) => `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${c}`,
                                        "FedEx": (c) => `https://www.fedex.com/fedextrack/?trknbr=${c}`,
                                    }
                                    const urlBuilder = carrierTrackingUrls[order.carrierName || ""]
                                    const trackingUrl = urlBuilder ? urlBuilder(order.trackingNumber!) : null

                                    const noParamCarriers = ["Aras Kargo", "MNG Kargo"]
                                    const isNoParam = noParamCarriers.includes(order.carrierName || "")

                                    return trackingUrl ? (
                                        <div className="space-y-2">
                                            {isNoParam && (
                                                <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
                                                    <p className="text-xs text-amber-800">
                                                        Takip kodunuzu kopyalayıp açılan sayfaya yapıştırın: <button onClick={() => { navigator.clipboard.writeText(order.trackingNumber!); toast?.("Kargo kodu kopyalandı") }} className="font-mono font-bold underline cursor-pointer">{order.trackingNumber}</button>
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
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Kargo takibi için <strong>{order.carrierName}</strong> web sitesini ziyaret edip <strong className="font-mono">{order.trackingNumber}</strong> kodunu girebilirsiniz.
                                        </p>
                                    )
                                })()}
                            </CardContent>
                        </Card>
                    )}
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
                                <span className="text-foreground">₺{order.totalAmount.toLocaleString("tr-TR")}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Kargo</span>
                                <span className="text-green-600">Ücretsiz</span>
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
                                    {order.shippingAddress.district}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Invoice button */}
                    <Button variant="outline" className="w-full" onClick={async () => {
                        try {
                            const invoice = await orderApi.getInvoice(order.id)
                            const w = window.open("", "_blank")
                            if (w) {
                                const invoiceDate = new Date(invoice.orderDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
                                w.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Fatura #${invoice.invoiceNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Georgia',serif;background:#f5f0eb;padding:40px;color:#1a1a2e}
.invoice{max-width:800px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)}
.header{background:#1a1a2e;padding:32px 40px;display:flex;justify-content:space-between;align-items:center}
.header h1{color:#d4a574;font-size:28px;letter-spacing:1px}
.header .meta{color:#a0a0b8;font-size:12px;text-align:right;letter-spacing:1px}
.header .meta p{margin:4px 0}
.info{padding:32px 40px;display:flex;justify-content:space-between;border-bottom:1px solid #e8e0d8}
.info .block h3{color:#8a8078;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
.info .block p{font-size:14px;line-height:1.6;color:#4a4a4a}
table{width:100%;border-collapse:collapse;margin:0}
thead th{background:#faf8f5;padding:12px 20px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8a8078;border-bottom:2px solid #e8e0d8}
tbody td{padding:14px 20px;border-bottom:1px solid #f0ebe4;font-size:14px}
tbody tr:last-child td{border-bottom:none}
.totals{padding:24px 40px;background:#faf8f5;border-top:2px solid #e8e0d8}
.totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#4a4a4a}
.totals .row.grand{font-size:20px;font-weight:700;color:#1a1a2e;padding-top:12px;border-top:1px solid #e8e0d8;margin-top:8px}
.footer{padding:24px 40px;text-align:center;font-size:11px;color:#b0a898;font-style:italic}
@media print{body{background:#fff;padding:0}.invoice{box-shadow:none;border-radius:0}.no-print{display:none!important}}
</style></head><body>
<div class="no-print" style="text-align:center;margin-bottom:16px"><button onclick="window.print()" style="background:#1a1a2e;color:#d4a574;border:none;padding:12px 32px;border-radius:6px;font-size:14px;cursor:pointer;font-family:Georgia,serif;letter-spacing:1px">PDF Olarak Kaydet / Yazdır</button></div>
<div class="invoice">
<div class="header"><div><h1>Can Antika</h1><p style="color:#a0a0b8;font-size:12px;letter-spacing:3px;margin-top:4px">EST. 1989 · İSTANBUL</p></div><div class="meta"><p>FATURA</p><p style="font-size:16px;color:#d4a574;font-weight:600">#${invoice.invoiceNumber}</p><p>${invoiceDate}</p></div></div>
<div class="info"><div class="block"><h3>Müşteri</h3><p>${invoice.customerName}</p></div><div class="block" style="text-align:right"><h3>Teslimat Adresi</h3><p>${invoice.shippingAddressSummary}</p></div></div>
<table><thead><tr><th>Ürün</th><th style="text-align:center">Adet</th><th style="text-align:right">Birim Fiyat</th><th style="text-align:right">Toplam</th></tr></thead><tbody>`)
                                invoice.items.forEach((item) => {
                                    w.document.write(`<tr><td>${item.productTitle}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">₺${item.unitPrice.toLocaleString("tr-TR")}</td><td style="text-align:right">₺${item.lineTotal.toLocaleString("tr-TR")}</td></tr>`)
                                })
                                w.document.write(`</tbody></table>
<div class="totals"><div class="row"><span>Ara Toplam</span><span>₺${invoice.subtotal.toLocaleString("tr-TR")}</span></div><div class="row"><span>Kargo</span><span>Ücretsiz</span></div><div class="row grand"><span>Genel Toplam</span><span>₺${invoice.totalAmount.toLocaleString("tr-TR")}</span></div></div>
<div class="footer">"Geçmişin izinde, geleceğe miras" · ${settings?.address || ""} · ${settings?.phone || ""}</div>
</div></body></html>`)
                                w.document.close()
                            }
                        } catch {
                            toast.error("Fatura yüklenemedi")
                        }
                    }}>
                        <FileText className="mr-2 h-4 w-4" />
                        Fatura / PDF
                    </Button>

                    {/* Cancel button */}
                    {(order.orderStatus === "PENDING" || order.orderStatus === "PAID") && (
                        <Button
                            variant="destructive"
                            className="w-full"
                            disabled={isCancelling}
                            onClick={async () => {
                                if (!confirm("Siparişi iptal etmek istediğinize emin misiniz?")) return
                                setIsCancelling(true)
                                try {
                                    const updated = await orderApi.cancelOrder(order.id)
                                    setOrder(updated)
                                    toast.success("Sipariş iptal edildi")
                                } catch (err) {
                                    toast.error(err instanceof Error ? err.message : "Sipariş iptal edilemedi")
                                } finally {
                                    setIsCancelling(false)
                                }
                            }}
                        >
                            {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            {isCancelling ? "İptal Ediliyor..." : "Siparişi İptal Et"}
                        </Button>
                    )}

                    {/* Return request button - only for DELIVERED orders */}
                    {order.orderStatus === "DELIVERED" && (
                        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full gap-2">
                                    <RotateCcw className="h-4 w-4" />
                                    İade Talebi Oluştur
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-background">
                                <DialogHeader>
                                    <DialogTitle className="font-serif">İade Talebi</DialogTitle>
                                    <DialogDescription>
                                        Sipariş #{order.id} için iade talebinizi oluşturun.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-2">
                                    <Textarea
                                        placeholder="İade nedeninizi açıklayın..."
                                        rows={4}
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                    />
                                    <Button
                                        className="w-full"
                                        disabled={isReturning || !returnReason.trim()}
                                        onClick={async () => {
                                            setIsReturning(true)
                                            try {
                                                await orderReturnApi.createReturn({ orderId: order.id, reason: returnReason })
                                                toast.success("İade talebiniz oluşturuldu")
                                                setReturnDialogOpen(false)
                                                setReturnReason("")
                                            } catch {
                                                toast.error("İade talebi oluşturulamadı")
                                            } finally {
                                                setIsReturning(false)
                                            }
                                        }}
                                    >
                                        {isReturning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                                        {isReturning ? "Gönderiliyor..." : "Talebi Gönder"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return (
        <AuthGuard>
            <div className="min-h-screen bg-background">
                <Header />
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        <DashboardSidebar />
                        <main className="flex-1">
                            <OrderDetailContent orderId={Number(id)} />
                        </main>
                    </div>
                </div>
                <Footer />
            </div>
        </AuthGuard>
    )
}
