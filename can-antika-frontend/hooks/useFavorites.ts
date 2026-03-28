"use client"

import { useState, useEffect, useCallback } from "react"
import { wishlistApi, cartApi } from "@/lib/api"
import { toast } from "sonner"
import type { WishlistItemResponse } from "@/lib/types"

export function useFavorites() {
    const [items, setItems] = useState<WishlistItemResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [removingIds, setRemovingIds] = useState<Set<number>>(new Set())

    useEffect(() => {
        wishlistApi
            .getWishlist()
            .then((data) => setItems(data.items || []))
            .catch(() => setItems([]))
            .finally(() => setIsLoading(false))
    }, [])

    const removeItem = useCallback(async (productId: number) => {
        setRemovingIds((prev) => new Set(prev).add(productId))
        try {
            await wishlistApi.removeItem(productId)
            setItems((prev) => prev.filter((i) => i.product.id !== productId))
            toast.success("Favorilerden kaldırıldı")
        } catch {
            toast.error("Kaldırılırken hata oluştu")
        } finally {
            setRemovingIds((prev) => {
                const next = new Set(prev)
                next.delete(productId)
                return next
            })
        }
    }, [])

    const addToCart = useCallback(async (productId: number) => {
        try {
            await cartApi.addItem({ productId, quantity: 1 })
            toast.success("Sepete eklendi")
        } catch {
            toast.error("Sepete eklenirken hata oluştu")
        }
    }, [])

    return { items, isLoading, removingIds, removeItem, addToCart }
}
