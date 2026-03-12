import { useState, useEffect } from "react"
import { cartApi, addressApi } from "@/lib/api"
import type { CartResponse, AddressResponse } from "@/lib/types"

export interface CheckoutData {
    cart: CartResponse | null
    addresses: AddressResponse[]
    selectedAddressId: number | null
    setSelectedAddressId: (id: number | null) => void
    note: string
    setNote: (note: string) => void
    isLoading: boolean
    cartTotal: number
    itemCount: number
}

export function useCheckoutData(): CheckoutData {
    const [cart, setCart] = useState<CartResponse | null>(null)
    const [addresses, setAddresses] = useState<AddressResponse[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
    const [note, setNote] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            cartApi.getCart().catch(() => null),
            addressApi.getMyAddresses().catch(() => []),
        ]).then(([cartData, addressData]) => {
            setCart(cartData)
            setAddresses(addressData)
            if (addressData.length > 0) setSelectedAddressId(addressData[0].id)
            setIsLoading(false)
        })
    }, [])

    const cartTotal = cart?.items?.reduce((sum, item) => sum + item.total, 0) ?? 0
    const itemCount = cart?.items?.length ?? 0

    return {
        cart,
        addresses,
        selectedAddressId,
        setSelectedAddressId,
        note,
        setNote,
        isLoading,
        cartTotal,
        itemCount,
    }
}
