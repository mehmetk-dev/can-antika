"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { cartApi } from "@/lib/api"
import { guestCart, type GuestCartItem } from "@/lib/commerce/guest-cart"
import { toast } from "sonner"
import type { CartResponse, CartItemResponse } from "@/lib/types"

export interface NormalizedCartItem {
    id: number
    product: CartItemResponse["product"]
    quantity: number
    price: number
    total: number
}

export function useCart() {
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const [cart, setCart] = useState<CartResponse | null>(null)
    const [guestItems, setGuestItems] = useState<GuestCartItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set())

    const isGuest = !authLoading && !isAuthenticated

    const fetchCart = () => {
        if (authLoading) return
        if (isAuthenticated) {
            cartApi.getCart()
                .then(setCart)
                .catch((err) => {
                    console.error("Sepet yüklenemedi:", err)
                    setCart(null)
                })
                .finally(() => setIsLoading(false))
        } else {
            setGuestItems(guestCart.getItems())
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCart()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, authLoading])

    // Cross-tab sync for guest cart via storage event + same-tab event
    useEffect(() => {
        if (authLoading || isAuthenticated) return

        const syncGuest = () => setGuestItems(guestCart.getItems())
        const onStorage = (e: StorageEvent) => {
            if (e.key === "can_antika_guest_cart") syncGuest()
        }

        // Other tabs: localStorage change fires "storage" event
        window.addEventListener("storage", onStorage)
        // Same tab: guest-cart.ts dispatches "cart-updated" event
        window.addEventListener("cart-updated", syncGuest)

        return () => {
            window.removeEventListener("storage", onStorage)
            window.removeEventListener("cart-updated", syncGuest)
        }
    }, [authLoading, isAuthenticated])

    const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
        if (newQuantity < 1) return

        // Client-side stock validation
        const item = items.find((i) => i.product.id === productId)
        const maxStock = item?.product.stock
        if (maxStock != null && newQuantity > maxStock) {
            toast.error(`Stokta yalnızca ${maxStock} adet mevcut`)
            return
        }

        setUpdatingItems((prev) => new Set(prev).add(productId))
        try {
            if (isGuest) {
                guestCart.updateQuantity(productId, newQuantity)
                setGuestItems(guestCart.getItems())
            } else {
                const updated = await cartApi.updateQuantity(productId, newQuantity)
                setCart(updated)
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Ekleyemezsiniz, stok yetersiz veya hata oluştu")
        } finally {
            setUpdatingItems((prev) => {
                const next = new Set(prev)
                next.delete(productId)
                return next
            })
        }
    }

    const handleRemoveItem = async (productId: number) => {
        setUpdatingItems((prev) => new Set(prev).add(productId))
        try {
            if (isGuest) {
                guestCart.removeItem(productId)
                setGuestItems(guestCart.getItems())
            } else {
                const updated = await cartApi.removeItem(productId)
                setCart(updated)
            }
            toast.success("Ürün sepetten kaldırıldı")
        } catch {
            toast.error("Ürün kaldırılırken hata oluştu")
        } finally {
            setUpdatingItems((prev) => {
                const next = new Set(prev)
                next.delete(productId)
                return next
            })
        }
    }

    const handleClearCart = async () => {
        if (!confirm("Sepetinizdeki tüm ürünleri silmek istediğinize emin misiniz?")) return
        try {
            if (isGuest) {
                guestCart.clear()
                setGuestItems([])
            } else {
                await cartApi.clearCart()
                setCart(null)
            }
            toast.success("Sepet temizlendi")
        } catch {
            toast.error("Sepet temizlenirken hata oluştu")
        }
    }

    // Normalize both modes into a unified item list
    const items: NormalizedCartItem[] = isGuest
        ? guestItems.map((g) => ({
            id: g.product.id,
            product: g.product,
            quantity: g.quantity,
            price: g.product.price,
            total: g.product.price * g.quantity,
        }))
        : (cart?.items ?? [])

    const cartTotal = items.reduce((sum, item) => sum + item.total, 0)
    const itemCount = items.length

    return {
        items,
        cartTotal,
        itemCount,
        isLoading,
        isGuest,
        updatingItems,
        handleUpdateQuantity,
        handleRemoveItem,
        handleClearCart,
    }
}
