"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { cartApi, wishlistApi } from "@/lib/api"
import { guestCart } from "@/lib/commerce/guest-cart"
import type { ProductResponse } from "@/lib/types"

export interface ProductActionsState {
    quantity: number
    setQuantity: (q: number | ((prev: number) => number)) => void
    addingToCart: boolean
    addedToCart: boolean
    addingToWishlist: boolean
    addedToWishlist: boolean
    handleAddToCart: () => Promise<void>
    handleAddToWishlist: () => Promise<void>
    handleShare: () => Promise<void>
}

export function useProductActions(product: ProductResponse, maxStock: number): ProductActionsState {
    const { isAuthenticated } = useAuth()
    const [quantity, setQuantity] = useState(1)
    const [addingToCart, setAddingToCart] = useState(false)
    const [addedToCart, setAddedToCart] = useState(false)
    const [addingToWishlist, setAddingToWishlist] = useState(false)
    const [addedToWishlist, setAddedToWishlist] = useState(false)

    useEffect(() => {
        let cancelled = false
        if (isAuthenticated) {
            cartApi.getCart().then(cart => {
                if (cancelled) return
                const item = cart.items?.find(i => i.product.id === product.id)
                if (item && item.quantity >= maxStock) {
                    setAddedToCart(true)
                }
            }).catch(() => {
                // Sepet kontrol hatası sessizce görmezden gelinir
            })
        } else {
            const items = guestCart.getItems()
            const item = items.find(i => i.product.id === product.id)
            if (item && item.quantity >= maxStock) {
                setAddedToCart(true)
            }
        }
        return () => { cancelled = true }
    }, [isAuthenticated, product.id, maxStock])

    const handleAddToCart = useCallback(async () => {
        if (addedToCart) {
            toast.info("Bu ürün zaten sepetinizde")
            return
        }
        if (quantity < 1 || quantity > maxStock) {
            toast.error(`Lütfen 1 ile ${maxStock} arasında bir miktar seçin`)
            return
        }
        setAddingToCart(true)
        try {
            if (isAuthenticated) {
                await cartApi.addItem({ productId: product.id, quantity })
            } else {
                guestCart.addItem(product, quantity)
            }
            toast.success(`${quantity} adet ürün sepete eklendi`)
            setAddedToCart(true)
        } catch (err) {
            toast.error(getErrorMessage(err, "Sepete eklenirken hata oluştu"))
        } finally {
            setAddingToCart(false)
        }
    }, [addedToCart, quantity, maxStock, isAuthenticated, product])

    const handleAddToWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            toast.info("Favorilere eklemek için giriş yapmalısınız")
            return
        }
        if (addedToWishlist) {
            toast.info("Bu ürün zaten favorilerinizde")
            return
        }
        setAddingToWishlist(true)
        try {
            await wishlistApi.addItem(product.id)
            toast.success("Ürün favorilere eklendi")
            setAddedToWishlist(true)
        } catch (err) {
            toast.error(getErrorMessage(err, "Favorilere eklenirken hata oluştu"))
        } finally {
            setAddingToWishlist(false)
        }
    }, [isAuthenticated, addedToWishlist, product.id])

    const handleShare = useCallback(async () => {
        const url = window.location.href
        const title = product.title
        if (navigator.share) {
            try { await navigator.share({ title, url }) } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
            toast.success("Bağlantı kopyalandı")
        }
    }, [product.title])

    return {
        quantity, setQuantity,
        addingToCart, addedToCart,
        addingToWishlist, addedToWishlist,
        handleAddToCart, handleAddToWishlist, handleShare,
    }
}
