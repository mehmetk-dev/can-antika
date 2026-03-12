import { useState } from "react"
import { cartApi } from "@/lib/api"
import { toast } from "sonner"

export interface CouponState {
    couponCode: string
    setCouponCode: (code: string) => void
    appliedCoupon: string | null
    discount: number
    isApplyingCoupon: boolean
    handleApplyCoupon: () => Promise<void>
    handleRemoveCoupon: () => Promise<void>
}

export function useCoupon(cartTotal: number): CouponState {
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
    const [discount, setDiscount] = useState(0)
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return
        setIsApplyingCoupon(true)
        try {
            const result = await cartApi.applyCoupon(couponCode.trim())
            const newTotal = result?.items?.reduce((sum: number, item: { total: number }) => sum + item.total, 0) ?? cartTotal
            const diff = cartTotal - newTotal
            if (diff > 0) {
                setDiscount(diff)
                setAppliedCoupon(couponCode.trim().toUpperCase())
                setCouponCode("")
                toast.success(`Kupon uygulandı! ₺${diff.toLocaleString("tr-TR")} indirim`)
            } else {
                setAppliedCoupon(couponCode.trim().toUpperCase())
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
            await cartApi.removeCoupon()
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
