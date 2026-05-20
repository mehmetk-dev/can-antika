"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { cartApi, productApi, wishlistApi } from "@/lib/api"
import { guestCart, isGuestCartProductSellable } from "@/lib/commerce/guest-cart"
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
        setAddedToCart(false)
        setAddedToWishlist(false)
    }, [product.id])

    useEffect(() => {
        if (!isAuthenticated) {
            setAddedToWishlist(false)
            return
        }
        let isCancelled = false
        wishlistApi.getWishlist()
            .then((wishlist) => {
                if (!isCancelled) {
                    setAddedToWishlist(wishlist.items.some((item) => item.product.id === product.id))
                }
            })
            .catch(() => {
                if (!isCancelled) setAddedToWishlist(false)
            })
        return () => {
            isCancelled = true
        }
    }, [isAuthenticated, product.id])

const handleAddToCart = useCallback(async () => {
        if (quantity < 1 || quantity > maxStock) {
            toast.error(`Lütfen 1 ile ${maxStock} arasında bir miktar seçin`)
            return
        }
        setAddingToCart(true)
        try {
            const freshProduct = await productApi.getById(product.id, 3000)
            const freshStock = Math.max(freshProduct.stock ?? 0, 0)
            if (freshStock < quantity || !isGuestCartProductSellable(freshProduct)) {
                window.dispatchEvent(new CustomEvent("product-stock-updated", { detail: { product: freshProduct } }))
                toast.error("Bu ürün satıldı veya stokta yok.")
                return
            }
            if (isAuthenticated) {
                await cartApi.addItem({ productId: product.id, quantity })
            } else {
                guestCart.addItem(freshProduct, quantity)
            }
            toast.success(`${quantity} adet ürün sepete eklendi`, {
                action: {
                    label: "Sepete Git",
                    onClick: () => { window.location.href = "/sepet" },
                },
            })
            setAddedToCart(true)
        } catch (err) {
            toast.error(getErrorMessage(err, "Sepete eklenirken hata oluştu"))
        } finally {
            setAddingToCart(false)
        }
    }, [quantity, maxStock, isAuthenticated, product])

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
