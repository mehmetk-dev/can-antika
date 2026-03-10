"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoreHorizontal, Eye, Truck, CheckCircle, Loader2, XCircle, CreditCard, Package } from "lucide-react"
import { orderApi } from "@/lib/api"
import { toast } from "sonner"
import type { OrderResponse } from "@/lib/types"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; className: string }> = {
  PENDING: { label: "Beklemede", variant: "secondary", className: "" },
  PAID: { label: "Ödendi", variant: "default", className: "bg-primary/20 text-primary" },
  SHIPPED: { label: "Kargoda", variant: "outline", className: "border-accent text-accent" },
  DELIVERED: { label: "Teslim Edildi", variant: "default", className: "bg-primary/10 text-primary" },
  CANCELLED: { label: "İptal", variant: "secondary", className: "bg-destructive/20 text-destructive" },
}

const carriers = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "Sürat Kargo",
  "PTT Kargo",
  "UPS",
  "DHL",
  "FedEx",
  "Trendyol Express",
  "Hepsijet",
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [statusFilter, setStatusFilter] = useState("all")
  const PAGE_SIZE = 20

  // Tracking dialog state
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)
  const [trackingOrder, setTrackingOrder] = useState<OrderResponse | null>(null)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrierName, setCarrierName] = useState("Yurtiçi Kargo")
  const [isSavingTracking, setIsSavingTracking] = useState(false)

  // Detail dialog state
  const [detailOrder, setDetailOrder] = useState<OrderResponse | null>(null)

  useEffect(() => {
    setIsLoading(true)
    orderApi
      .getAllOrders(page, PAGE_SIZE)
      .then((data) => {
        setOrders(data.items)
        setTotalPages(Math.ceil(data.totalElement / PAGE_SIZE))
      })
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false))
  }, [page])

  const openTrackingDialog = (order: OrderResponse) => {
    setTrackingOrder(order)
    setTrackingNumber(order.trackingNumber || "")
    setCarrierName(order.carrierName || "Yurtiçi Kargo")
    setTrackingDialogOpen(true)
  }

  const handleSaveTracking = async () => {
    if (!trackingOrder || !trackingNumber.trim()) {
      toast.error("Takip numarası giriniz")
      return
    }
    setIsSavingTracking(true)
    try {
      const updated = await orderApi.updateTracking(trackingOrder.id, trackingNumber.trim(), carrierName)
      setOrders((prev) => prev.map((o) => (o.id === trackingOrder.id ? updated : o)))
      toast.success("Kargo bilgisi güncellendi")
      setTrackingDialogOpen(false)
    } catch {
      toast.error("Güncelleme başarısız")
    } finally {
      setIsSavingTracking(false)
    }
  }

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const updated = await orderApi.updateOrderStatus(orderId, newStatus)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      toast.success(`Sipariş durumu güncellendi: ${statusConfig[newStatus]?.label || newStatus}`)
    } catch {
      toast.error("Durum güncellenemedi")
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  const filteredOrders = statusFilter === "all" ? orders : orders.filter((o) => o.orderStatus === statusFilter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Siparişler</h1>
        <p className="text-muted-foreground">Sipariş yönetimi ve takibi</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="PENDING">Beklemede</SelectItem>
            <SelectItem value="PAID">Ödendi</SelectItem>
            <SelectItem value="SHIPPED">Kargoda</SelectItem>
            <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
            <SelectItem value="CANCELLED">İptal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Kargo</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const status = statusConfig[order.orderStatus] || { label: order.orderStatus, variant: "outline" as const, className: "" }
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.user?.name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{order.user?.email || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {order.orderItems?.[0]?.title || "—"}
                      {(order.orderItems?.length || 0) > 1 && ` +${order.orderItems.length - 1}`}
                    </TableCell>
                    <TableCell>₺{order.totalAmount.toLocaleString("tr-TR")}</TableCell>
                    <TableCell>
                      {order.trackingNumber ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground">{order.carrierName}</p>
                          <p className="text-xs font-mono text-muted-foreground">{order.trackingNumber}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailOrder(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Detayları Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openTrackingDialog(order)}>
                            <Truck className="mr-2 h-4 w-4" />
                            Kargo Bilgisi {order.trackingNumber ? "Güncelle" : "Gir"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.orderStatus === "PENDING" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "PAID")}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Ödendi Olarak İşaretle
                            </DropdownMenuItem>
                          )}
                          {(order.orderStatus === "PENDING" || order.orderStatus === "PAID") && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "SHIPPED")}>
                              <Package className="mr-2 h-4 w-4" />
                              Kargoya Ver
                            </DropdownMenuItem>
                          )}
                          {order.orderStatus === "SHIPPED" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "DELIVERED")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Teslim Edildi
                            </DropdownMenuItem>
                          )}
                          {order.orderStatus !== "CANCELLED" && order.orderStatus !== "DELIVERED" && (
                            <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(order.id, "CANCELLED")}>
                              <XCircle className="mr-2 h-4 w-4" />
                              İptal Et
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Sipariş bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Önceki
          </Button>
          <span className="text-sm text-muted-foreground px-3">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Sonraki
          </Button>
        </div>
      )}

      {/* Kargo Bilgisi Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Kargo Bilgisi</DialogTitle>
            <DialogDescription>
              Sipariş #{trackingOrder?.id} için kargo takip bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kargo Firması</Label>
              <Select value={carrierName} onValueChange={setCarrierName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {carriers.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Takip Numarası</Label>
              <Input
                placeholder="Kargo takip numarasını girin"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="font-mono"
              />
            </div>
            {trackingOrder?.trackingNumber && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground">Mevcut: <span className="font-medium text-foreground">{trackingOrder.carrierName}</span> — <span className="font-mono">{trackingOrder.trackingNumber}</span></p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveTracking} disabled={isSavingTracking || !trackingNumber.trim()}>
              {isSavingTracking ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor...</>
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sipariş Detay Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => { if (!open) setDetailOrder(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Sipariş #{detailOrder?.id}</DialogTitle>
            <DialogDescription>
              {detailOrder && formatDate(detailOrder.orderDate)} — {detailOrder?.user?.name}
            </DialogDescription>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4 py-2">
              {/* Status + Tracking */}
              <div className="flex items-center justify-between">
                <Badge variant={statusConfig[detailOrder.orderStatus]?.variant || "outline"} className={statusConfig[detailOrder.orderStatus]?.className || ""}>
                  {statusConfig[detailOrder.orderStatus]?.label || detailOrder.orderStatus}
                </Badge>
                {detailOrder.trackingNumber && (
                  <div className="text-right text-sm">
                    <p className="font-medium">{detailOrder.carrierName}</p>
                    <p className="font-mono text-muted-foreground">{detailOrder.trackingNumber}</p>
                  </div>
                )}
              </div>
              {/* Items */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Ürünler</p>
                <div className="rounded-md border divide-y">
                  {detailOrder.orderItems?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{item.title || `Ürün #${item.product?.id}`}</p>
                        <p className="text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <p className="font-medium">₺{item.price?.toLocaleString("tr-TR")}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Address */}
              {detailOrder.shippingAddress && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Teslimat Adresi</p>
                  <p className="text-sm text-muted-foreground">
                    {detailOrder.shippingAddress.addressLine}, {detailOrder.shippingAddress.district}, {detailOrder.shippingAddress.city}
                  </p>
                </div>
              )}
              {/* Total */}
              <div className="flex items-center justify-between border-t pt-3">
                <p className="font-medium">Toplam</p>
                <p className="text-lg font-bold text-primary">₺{detailOrder.totalAmount.toLocaleString("tr-TR")}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
