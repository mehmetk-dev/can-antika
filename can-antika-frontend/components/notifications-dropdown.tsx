"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// UI Components
import { ScrollArea } from "@/components/ui/scroll-area"
import { notificationApi } from "@/lib/api"
import type { NotificationResponse } from "@/lib/types"
import { cn, formatDateTR } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export function NotificationsDropdown() {
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const [notifications, setNotifications] = useState<NotificationResponse[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    // To prevent multiple fetches
    const hasFetchedRef = useRef(false)

    useEffect(() => {
        if (!isAuthenticated) {
            hasFetchedRef.current = false
            setNotifications([])
            setUnreadCount(0)
        }
    }, [isAuthenticated])

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return
        try {
            setIsLoading(true)
            const [list, countRes] = await Promise.all([
                notificationApi.getAll(),
                notificationApi.getUnreadCount(),
            ])
            setNotifications(list)
            setUnreadCount(countRes.count)
        } catch {
            // silently handle — header dropdown should not disrupt UX
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated])

    // Initial fetch
    useEffect(() => {
        if (authLoading || !isAuthenticated) return

        if (!hasFetchedRef.current) {
            void fetchNotifications()
            hasFetchedRef.current = true
        }

        const handleUpdated = () => {
            void fetchNotifications()
        }

        const handleFocus = () => {
            void fetchNotifications()
        }

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                void fetchNotifications()
            }
        }

        window.addEventListener("notification-updated", handleUpdated)
        window.addEventListener("focus", handleFocus)
        document.addEventListener("visibilitychange", handleVisibility)
        return () => {
            window.removeEventListener("notification-updated", handleUpdated)
            window.removeEventListener("focus", handleFocus)
            document.removeEventListener("visibilitychange", handleVisibility)
        }
    }, [authLoading, isAuthenticated, fetchNotifications])

    // Refetch when opening
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (open) {
            void fetchNotifications()
        }
    }

    const parseDate = (dateVal: any) => {
        if (Array.isArray(dateVal)) {
            return new Date(dateVal[0], dateVal[1] - 1, dateVal[2], dateVal[3] || 0, dateVal[4] || 0)
        }
        return new Date(dateVal)
    }

    const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await notificationApi.markAsRead(id)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
        } catch {
            // silently handle
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead()
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch {
            // silently handle
        }
    }

    const handleNotificationClick = (notification: NotificationResponse) => {
        // Determine redirect based on type
        if (!notification.read) {
            handleMarkAsRead(notification.id, { stopPropagation: () => { } } as React.MouseEvent)
        }

        setIsOpen(false)

        if (notification.type.includes("TICKET")) {
            router.push(`/hesap/destek/${notification.referenceId}`)
        } else if (notification.type.includes("ORDER")) {
            router.push(`/hesap/siparisler/${notification.referenceId}`)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-background">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Bildirimler</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold">Bildirimler</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-primary"
                        >
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Bell className="h-12 w-12 opacity-20 mb-3" />
                            <p>Henüz bildiriminiz yok</p>
                        </div>
                    ) : (
                        <div className="grid">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "relative flex cursor-pointer gap-4 px-4 py-4 transition-colors hover:bg-muted/50",
                                        !notification.read && "bg-primary/5"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn("text-sm font-medium leading-none", !notification.read && "text-primary")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDateTR(parseDate(notification.createdAt), "day-month")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="flex h-full flex-col justify-center">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
