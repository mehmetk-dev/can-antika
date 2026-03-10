"use client"

import { useState, useEffect, use, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Calendar, MapPin, ShoppingBag, Loader2, Ban, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { userApi, orderApi } from "@/lib/api"
import type { UserResponse, OrderResponse } from "@/lib/types"
import { toast } from "sonner"

const statusLabels: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Hazırlanıyor", className: "bg-amber-100 text-amber-800" },
    PAID: { label: "Ödendi", className: "bg-emerald-100 text-emerald-800" },
    SHIPPED: { label: "Kargoda", className: "bg-blue-100 text-blue-800" },
    DELIVERED: { label: "Teslim Edildi", className: "bg-green-100 text-green-800" },
    CANCELLED: { label: "İptal", className: "bg-red-100 text-red-800" },
}

function CustomerDetailContent({ customerId }: { customerId: number }) {
    const [customer, setCustomer] = useState<UserResponse | null>(null)
    const [orders, setOrders] = useState<OrderResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)

    const fetchCustomer = useCallback(async () => {
        try {
            const user = await userApi.getById(customerId)
            setCustomer(user)
        } catch {
            setCustomer(null)
        }
    }, [customerId])

    useEffect(() => {
        Promise.all([
            fetchCustomer(),
            orderApi.getAllOrders(0, 100).catch(() => ({ items: [] as OrderResponse[], totalElement: 0, pageNumber: 0, pageSize: 100 })),
        ]).then(([, ordersData]) => {
            if (ordersData && ordersData.items) {
                setOrders(ordersData.items.filter((o: any) => o.user?.id === customerId))
            }
            setIsLoading(false)
        })
    }, [fetchCustomer])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )
    }

    if (!customer) {
        return (
            <div className="text-center py-20">
                <p className="text-lg font-medium text-foreground">Müşteri bulunamadı</p>
                <Link href="/admin/musteriler">
                    <Button variant="outline" className="mt-4">Müşterilere Dön</Button>
                </Link>
            </div>
        )
    }

    const initials = customer.name.split(" ").map((n) => n[0]).join("")
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/musteriler">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <h1 className="font-serif text-2xl font-bold text-foreground">Müşteri Detayı</h1>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <Button
                    variant={customer.accountNonLocked ? "destructive" : "default"}
                    disabled={isUpdating || customer.role === "ADMIN"}
                    onClick={async () => {
                        if (customer.role === "ADMIN") {
                            toast.error("Admin kullanıcısı banlanamaz")
                            return
                        }
                        if (!confirm(`Emin misiniz? Müşteri ${customer.accountNonLocked ? "banlanacak" : "engeli kaldırılacak"}.`)) return
                        setIsUpdating(true)
                        try {
                            if (customer.accountNonLocked) {
                                await userApi.ban(customerId)
                                toast.success("Kullanıcı banlandı")
                            } else {
                                await userApi.unban(customerId)
                                toast.success("Kullanıcının engeli kaldırıldı")
                            }
                            await fetchCustomer()
                        } catch (err: any) {
                            toast.error(err.message || "İşlem başarısız")
                        } finally {
                            setIsUpdating(false)
                        }
                    }}
                >
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                        customer.accountNonLocked ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {customer.accountNonLocked ? "Kullanıcıyı Banla" : "Banı Kaldır"}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Card */}
                <Card>
                    <CardContent className="p-6 text-center">
                        <Avatar className="mx-auto h-20 w-20">
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl">{initials}</AvatarFallback>
                        </Avatar>
                        <h2 className="mt-4 font-serif text-xl font-semibold text-foreground">{customer.name}</h2>
                        <div className="flex justify-center gap-2 mt-2">
                            <Badge variant={customer.role === "ADMIN" ? "default" : "secondary"}>
                                {customer.role === "ADMIN" ? "Admin" : "Kullanıcı"}
                            </Badge>
                            {!customer.accountNonLocked && (
                                <Badge variant="destructive">Banlı</Badge>
                            )}
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-3 text-left text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                {customer.email}
                            </div>
                            {customer.createdAt && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Kayıt: {new Date(customer.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats + Addresses */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
                                <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Toplam Harcama</p>
                                <p className="text-2xl font-bold text-primary">₺{totalSpent.toLocaleString("tr-TR")}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Adres Sayısı</p>
                                <p className="text-2xl font-bold text-foreground">{customer.addresses?.length || 0}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Addresses */}
                    {customer.addresses && customer.addresses.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-serif flex items-center gap-2">
                                    <MapPin className="h-5 w-5" /> Adresler
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {customer.addresses.map((addr) => (
                                    <div key={addr.id} className="rounded-lg border p-3">
                                        <p className="font-medium text-foreground">{addr.title}</p>
                                        <p className="text-sm text-muted-foreground">{addr.addressLine}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {addr.district}, {addr.city} {addr.postalCode}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Orders */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-serif flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" /> Siparişler ({orders.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {orders.length > 0 ? (
                        <div className="space-y-3">
                            {orders.map((order) => {
                                const st = statusLabels[order.orderStatus] || { label: order.orderStatus, className: "bg-muted" }
                                return (
                                    <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-1">
                                            <p className="font-medium text-foreground">
                                                #{order.id} — {order.orderItems?.[0]?.title || "Sipariş"}
                                                {(order.orderItems?.length || 0) > 1 && ` +${order.orderItems.length - 1}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(order.orderDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <span className="font-medium text-foreground">₺{order.totalAmount.toLocaleString("tr-TR")}</span>
                                            <Badge className={st.className}>{st.label}</Badge>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">Henüz sipariş yok</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <CustomerDetailContent customerId={Number(id)} />
}
