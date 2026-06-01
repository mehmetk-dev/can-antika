import { useState, useEffect } from "react"
import { cartApi, productApi, wishlistApi } from "@/lib/api"
import { guestCart, isGuestCartProductSellable, type GuestCartItem } from "@/lib/commerce/guest-cart"

export function useCartWishlistCounts(isAuthenticated: boolean) {
    const [cartCount, setCartCount] = useState(0)
    const [wishlistCount, setWishlistCount] = useState(0)

    useEffect(() => {
        let cancelled = false

        const refreshGuestCartCount = async () => {
            const storedItems = guestCart.getItems()
            if (storedItems.length === 0) {
                setCartCount(0)
                return
            }

            const results = await Promise.allSettled(
                storedItems.map(async (item): Promise<GuestCartItem | null> => {
                    const product = await productApi.getById(item.product.id, 3000)
                    const maxAllowed = Math.max(product.stock ?? 0, 0)
                    if (maxAllowed <= 0 || !isGuestCartProductSellable(product)) return null
                    return {
                        product,
                        quantity: Math.min(item.quantity, maxAllowed),
                    }
                }),
            )

            const refreshedItems = results
                .map((result, index): GuestCartItem | null => {
                    if (result.status === "fulfilled") return result.value
                    return storedItems[index] ?? null
                })
                .filter((item): item is GuestCartItem => item !== null)

            if (cancelled) return

            if (JSON.stringify(refreshedItems) !== JSON.stringify(storedItems)) {
                guestCart.replaceItems(refreshedItems)
            }
            setCartCount(refreshedItems.length)
        }

        const fetchCounts = () => {
            if (isAuthenticated) {
                cartApi.getCart()
                    .then((cart) => {
                        if (!cancelled) setCartCount(cart.items?.length ?? 0)
                    })
                    .catch(() => {
                        if (!cancelled) setCartCount(0)
                    })
                wishlistApi.getWishlist()
                    .then((list) => {
                        if (!cancelled) setWishlistCount(list.items?.length ?? 0)
                    })
                    .catch(() => {
                        if (!cancelled) setWishlistCount(0)
                    })
            } else {
                void refreshGuestCartCount()
                setWishlistCount(0)
            }
        }

        fetchCounts()

        window.addEventListener("cart-updated", fetchCounts)
        window.addEventListener("wishlist-updated", fetchCounts)

        return () => {
            cancelled = true
            window.removeEventListener("cart-updated", fetchCounts)
            window.removeEventListener("wishlist-updated", fetchCounts)
        }
    }, [isAuthenticated])

    return { cartCount, wishlistCount }
}
