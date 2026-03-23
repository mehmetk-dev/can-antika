import { useState, useEffect } from "react"
import { cartApi, wishlistApi } from "@/lib/api"
import { guestCart } from "@/lib/guest-cart"

export function useCartWishlistCounts(isAuthenticated: boolean) {
    const [cartCount, setCartCount] = useState(0)
    const [wishlistCount, setWishlistCount] = useState(0)

    const logCountError = (label: string, error: unknown) => {
        if (process.env.NODE_ENV !== "production") {
            console.error(label, error)
        }
    }

    useEffect(() => {
        const fetchCounts = () => {
            if (isAuthenticated) {
                cartApi.getCart()
                    .then((cart) => setCartCount(cart.items?.length ?? 0))
                    .catch((e) => {
                        setCartCount(0)
                        logCountError("Sepet sayısı alınamadı:", e)
                    })
                wishlistApi.getWishlist()
                    .then((list) => setWishlistCount(list.items?.length ?? 0))
                    .catch((e) => {
                        setWishlistCount(0)
                        logCountError("İstek listesi sayısı alınamadı:", e)
                    })
            } else {
                setCartCount(guestCart.getCount())
                setWishlistCount(0)
            }
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
