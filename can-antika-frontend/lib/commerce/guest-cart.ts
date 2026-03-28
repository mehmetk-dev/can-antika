import type { CartItemRequest, ProductResponse } from "../types"

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
        const maxAllowed = Math.max(product.stock ?? 0, 0)
        if (maxAllowed <= 0) throw new Error("Bu ürün şu anda stokta yok.")
        if (quantity <= 0) throw new Error("Miktar en az 1 olmalıdır.")

        const items = readCart()
        const existing = items.find(i => i.product.id === product.id)
        if (existing) {
            existing.quantity = Math.min(existing.quantity + quantity, maxAllowed)
        } else {
            items.push({ product, quantity: Math.min(quantity, maxAllowed) })
        }
        writeCart(items)
    },

    updateQuantity(productId: number, quantity: number) {
        const items = readCart()
        const item = items.find(i => i.product.id === productId)
        if (item) {
            const maxAllowed = Math.max(item.product.stock ?? 0, 0)
            if (maxAllowed <= 0 || quantity <= 0) {
                const nextItems = items.filter(i => i.product.id !== productId)
                writeCart(nextItems)
                return
            }
            item.quantity = Math.min(quantity, maxAllowed)
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
