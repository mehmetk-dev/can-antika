"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, Loader2, Package, Ticket, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { notificationApi } from "@/lib/api"
import type { NotificationResponse } from "@/lib/types"
import { cn, formatDateTR } from "@/lib/utils"

interface TypeConfig {
    label: string
    icon: typeof Bell
    badgeClass: string
}

const typeMap: Record<string, TypeConfig> = {
    ORDER_CONFIRMED: { label: "Sipariş Onayı", icon: Package, badgeClass: "bg-emerald-500/15 text-emerald-700" },
    ORDER_SHIPPED: { label: "Kargo", icon: Package, badgeClass: "bg-blue-500/15 text-blue-700" },
    ORDER_DELIVERED: { label: "Teslim Edildi", icon: Package, badgeClass: "bg-emerald-500/15 text-emerald-700" },
    ORDER_CANCELLED: { label: "İptal", icon: Package, badgeClass: "bg-red-500/15 text-red-700" },
    ORDER_STATUS_UPDATE: { label: "Sipariş Durumu", icon: Package, badgeClass: "bg-amber-500/15 text-amber-700" },
    TICKET_REPLY: { label: "Destek Yanıtı", icon: Ticket, badgeClass: "bg-violet-500/15 text-violet-700" },
    TICKET_CREATED: { label: "Yeni Talep", icon: Ticket, badgeClass: "bg-blue-500/15 text-blue-700" },
    WELCOME: { label: "Hoşgeldin", icon: Bell, badgeClass: "bg-emerald-500/15 text-emerald-700" },
}

const parseDate = (dateVal: string | number[]): Date => {
    if (Array.isArray(dateVal)) {
        return new Date(dateVal[0], dateVal[1] - 1, dateVal[2], dateVal[3] || 0, dateVal[4] || 0)
    }
    return new Date(dateVal)
}

type FilterType = "all" | "unread" | "read"

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const [filter, setFilter] = useState<FilterType>("all")

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [list, countRes] = await Promise.all([
                notificationApi.getAll(),
                notificationApi.getUnreadCount(),
            ])
            setNotifications(list)
            setUnreadCount(countRes.count)
        } catch {
            toast.error("Bildirimler yüklenemedi")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
            toast.success("Okundu olarak işaretlendi")
        } catch {
            toast.error("İşlem başarısız")
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead()
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            setUnreadCount(0)
            toast.success("Tüm bildirimler okundu olarak işaretlendi")
        } catch {
            toast.error("İşlem başarısız")
        }
    }

    const filtered = notifications.filter((n) => {
        if (filter === "unread") return !n.read
        if (filter === "read") return n.read
        return true
    })

    const filters: { key: FilterType; label: string }[] = [
        { key: "all", label: "Tümü" },
        { key: "unread", label: "Okunmamış" },
        { key: "read", label: "Okunmuş" },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Bildirimler</h1>
                    <p className="text-muted-foreground">
                        Tüm sistem bildirimleri
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                                {unreadCount} okunmamış
                            </Badge>
                        )}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
                        <CheckCheck className="h-4 w-4" />
                        Tümünü Okundu İşaretle
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {filters.map((f) => (
                    <Button
                        key={f.key}
                        variant={filter === f.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(f.key)}
                        className="text-xs"
                    >
                        {f.label}
                        {f.key === "unread" && unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]">
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>
                ))}
            </div>

            {/* Notification List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">
                            {filter === "unread" ? "Okunmamış bildirim yok" : filter === "read" ? "Okunmuş bildirim yok" : "Henüz bildirim yok"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {filtered.map((notification) => {
                                const config = typeMap[notification.type] || {
                                    label: notification.type,
                                    icon: Info,
                                    badgeClass: "bg-muted text-muted-foreground",
                                }
                                const IconComponent = config.icon

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 transition-colors",
                                            !notification.read && "bg-primary/[0.03]"
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className={cn(
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                            !notification.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <IconComponent className="h-4 w-4" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={cn("text-sm font-medium", !notification.read && "text-primary")}>
                                                    {notification.title}
                                                </span>
                                                <Badge className={cn("text-[10px]", config.badgeClass)}>
                                                    {config.label}
                                                </Badge>
                                                {!notification.read && (
                                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <span className="text-xs text-muted-foreground/60 mt-1 block">
                                                {formatDateTR(parseDate(notification.createdAt), "datetime")}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                aria-label="Okundu olarak işaretle"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
