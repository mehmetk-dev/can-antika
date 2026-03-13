"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { cartApi, wishlistApi } from "@/lib/api"
import { guestCart } from "@/lib/guest-cart"
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
    const router = useRouter()
    const [quantity, setQuantity] = useState(1)
    const [addingToCart, setAddingToCart] = useState(false)
    const [addedToCart, setAddedToCart] = useState(false)
    const [addingToWishlist, setAddingToWishlist] = useState(false)
    const [addedToWishlist, setAddedToWishlist] = useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            cartApi.getCart().then(cart => {
                const item = cart.items?.find(i => i.product.id === product.id)
                if (item && item.quantity >= maxStock) {
                    setAddedToCart(true)
                }
            }).catch((e) => console.error("Sepet kontrol hatası:", e))
        } else {
            const items = guestCart.getItems()
            const item = items.find(i => i.product.id === product.id)
            if (item && item.quantity >= maxStock) {
                setAddedToCart(true)
            }
        }
    }, [isAuthenticated, product.id, maxStock])

    const handleAddToCart = async () => {
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
            toast.error(err instanceof Error ? err.message : "Sepete eklenirken hata oluştu")
        } finally {
            setAddingToCart(false)
        }
    }

    const handleAddToWishlist = async () => {
        if (!isAuthenticated) {
            toast.error("Favorilere eklemek için giriş yapmalısınız")
            router.push("/giris")
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
            toast.error(err instanceof Error ? err.message : "Favorilere eklenirken hata oluştu")
        } finally {
            setAddingToWishlist(false)
        }
    }

    const handleShare = async () => {
        const url = window.location.href
        const title = product.title
        if (navigator.share) {
            try { await navigator.share({ title, url }) } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
            toast.success("Bağlantı kopyalandı")
        }
    }

    return {
        quantity, setQuantity,
        addingToCart, addedToCart,
        addingToWishlist, addedToWishlist,
        handleAddToCart, handleAddToWishlist, handleShare,
    }
}
