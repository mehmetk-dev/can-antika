import type { CartItemRequest, ProductResponse } from "./types"

const STORAGE_KEY = "can_antika_guest_cart"

export interface GuestCartItem {
    product: ProductResponse
    quantity: number
}

function readCart(): GuestCartItem[] {
    if (typeof window === "undefined") return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function writeCart(items: GuestCartItem[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event("cart-updated"))
}

export const guestCart = {
    getItems(): GuestCartItem[] {
        return readCart()
    },

    addItem(product: ProductResponse, quantity: number) {
        const items = readCart()
        const existing = items.find(i => i.product.id === product.id)
        if (existing) {
            existing.quantity = Math.min(existing.quantity + quantity, product.stock ?? 99)
        } else {
            items.push({ product, quantity })
        }
        writeCart(items)
    },

    updateQuantity(productId: number, quantity: number) {
        const items = readCart()
        const item = items.find(i => i.product.id === productId)
        if (item) {
            item.quantity = quantity
            writeCart(items)
        }
    },

    removeItem(productId: number) {
        const items = readCart().filter(i => i.product.id !== productId)
        writeCart(items)
    },

    clear() {
        if (typeof window === "undefined") return
        localStorage.removeItem(STORAGE_KEY)
        window.dispatchEvent(new Event("cart-updated"))
    },

    getCount(): number {
        return readCart().length
    },

    /** Login sonrası backend'e senkronize etmek için CartItemRequest[] döner */
    toSyncPayload(): CartItemRequest[] {
        return readCart().map(i => ({ productId: i.product.id, quantity: i.quantity }))
    },
}
