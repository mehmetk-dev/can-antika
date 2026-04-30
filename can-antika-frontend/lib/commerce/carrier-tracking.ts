const carrierTrackingUrls: Record<string, (code: string) => string> = {
    "Yurtiçi Kargo": (c) => `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(c)}`,
    "Aras Kargo": () => `https://araskargo.com.tr/kargo-takip`,
    "Sürat Kargo": (c) => `https://suratkargo.com.tr/KargoTakip/?kargotakipno=${encodeURIComponent(c)}`,
    "PTT Kargo": (c) => `https://gonderitakip.ptt.gov.tr/?barkod=${encodeURIComponent(c)}`,
    "UPS": (c) => `https://www.ups.com/track?tracknum=${encodeURIComponent(c)}&loc=tr_TR`,
    "DHL": (c) => `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${encodeURIComponent(c)}`,
    "FedEx": (c) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(c)}`,
    // Eski MNG siparişleri için geriye dönük uyumluluk (MNG → DHL eCommerce'e devredildi)
    "MNG Kargo": (c) => `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${encodeURIComponent(c)}`,
}

const noParamCarriers = new Set(["Aras Kargo"])

export function getTrackingUrl(carrier: string | undefined, trackingNumber: string): string | null {
    if (!carrier) return null
    const urlBuilder = carrierTrackingUrls[carrier]
    return urlBuilder ? urlBuilder(trackingNumber) : null
}

export function isNoParamCarrier(carrier: string | undefined): boolean {
    return carrier ? noParamCarriers.has(carrier) : false
}
