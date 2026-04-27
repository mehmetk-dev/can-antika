import { useEffect, useState } from "react"
import { cartApi } from "@/lib/api"
import { toast } from "sonner"
import type { CartResponse } from "@/lib/types"

export interface CouponState {
    couponCode: string
    setCouponCode: (code: string) => void
    appliedCoupon: string | null
    discount: number
    isApplyingCoupon: boolean
    handleApplyCoupon: () => Promise<void>
    handleRemoveCoupon: () => Promise<void>
}

export function useCoupon(cart: CartResponse | null, onCartUpdated?: (cart: CartResponse) => void): CouponState {
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
    const [discount, setDiscount] = useState(0)
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

    useEffect(() => {
        setAppliedCoupon(cart?.couponCode ?? null)
        setDiscount(cart?.discount ?? 0)
    }, [cart?.couponCode, cart?.discount])

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return
        setIsApplyingCoupon(true)
        try {
            const result = await cartApi.applyCoupon(couponCode.trim())
            const diff = result.discount ?? 0
            onCartUpdated?.(result)
            if (diff > 0) {
                setDiscount(diff)
                setAppliedCoupon(result.couponCode ?? couponCode.trim().toUpperCase())
                setCouponCode("")
                toast.success(`Kupon uygulandı! ₺${diff.toLocaleString("tr-TR")} indirim`)
            } else {
                setAppliedCoupon(result.couponCode ?? couponCode.trim().toUpperCase())
                setDiscount(0)
                setCouponCode("")
                toast.success("Kupon uygulandı")
            }
        } catch {
            toast.error("Geçersiz kupon kodu")
        } finally {
            setIsApplyingCoupon(false)
        }
    }

    const handleRemoveCoupon = async () => {
        try {
            const result = await cartApi.removeCoupon()
            onCartUpdated?.(result)
            setAppliedCoupon(null)
            setDiscount(0)
            toast.success("Kupon kaldırıldı")
        } catch {
            toast.error("Kupon kaldırılamadı")
        }
    }

    return {
        couponCode,
        setCouponCode,
        appliedCoupon,
        discount,
        isApplyingCoupon,
        handleApplyCoupon,
        handleRemoveCoupon,
    }
}
