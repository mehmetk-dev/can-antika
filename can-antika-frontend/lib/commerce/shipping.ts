interface ShippingSettings {
    freeShippingMin?: number | null
    expressShippingFee?: number | null
}

export function calculateShippingAmount(payableSubtotal: number, settings: ShippingSettings): number {
    if (!Number.isFinite(payableSubtotal) || payableSubtotal <= 0) return 0

    const freeShippingMin = settings.freeShippingMin ?? 0
    if (freeShippingMin > 0 && payableSubtotal >= freeShippingMin) return 0

    return Math.max(settings.expressShippingFee ?? 0, 0)
}

export function formatShippingAmount(amount: number): string {
    return amount > 0 ? `₺${amount.toLocaleString("tr-TR")}` : "Ücretsiz"
}
