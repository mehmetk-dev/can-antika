import { useState, useEffect } from "react"
import { cartApi, wishlistApi } from "@/lib/api"

export function useCartWishlistCounts(isAuthenticated: boolean) {
    const [cartCount, setCartCount] = useState(0)
    const [wishlistCount, setWishlistCount] = useState(0)

    useEffect(() => {
        if (!isAuthenticated) return

        const fetchCounts = () => {
            cartApi.getCart().then((cart) => setCartCount(cart.items?.length ?? 0)).catch((e) => console.error("Sepet sayısı alınamadı:", e))
            wishlistApi.getWishlist().then((list) => setWishlistCount(list.items?.length ?? 0)).catch((e) => console.error("İstek listesi sayısı alınamadı:", e))
        }

        fetchCounts()

        window.addEventListener("cart-updated", fetchCounts)
        window.addEventListener("wishlist-updated", fetchCounts)

        return () => {
            window.removeEventListener("cart-updated", fetchCounts)
            window.removeEventListener("wishlist-updated", fetchCounts)
        }
    }, [isAuthenticated])

    return { cartCount, wishlistCount }
}
