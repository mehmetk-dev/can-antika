import { useState, useEffect } from "react"
import { cartApi, wishlistApi } from "@/lib/api"
import { guestCart } from "@/lib/commerce/guest-cart"

export function useCartWishlistCounts(isAuthenticated: boolean) {
    const [cartCount, setCartCount] = useState(0)
    const [wishlistCount, setWishlistCount] = useState(0)

    useEffect(() => {
        const fetchCounts = () => {
            if (isAuthenticated) {
                cartApi.getCart()
                    .then((cart) => setCartCount(cart.items?.length ?? 0))
                    .catch(() => {
                        setCartCount(0)
                    })
                wishlistApi.getWishlist()
                    .then((list) => setWishlistCount(list.items?.length ?? 0))
                    .catch(() => {
                        setWishlistCount(0)
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
