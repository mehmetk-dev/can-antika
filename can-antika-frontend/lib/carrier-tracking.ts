const carrierTrackingUrls: Record<string, (code: string) => string> = {
    "Yurtiçi Kargo": (c) => `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(c)}`,
    "Aras Kargo": () => `https://araskargo.com.tr/kargo-takip`,
    "MNG Kargo": () => `https://www.mngkargo.com.tr/gonderitakip`,
    "Sürat Kargo": (c) => `https://suratkargo.com.tr/KargoTakip/?kargotakipno=${encodeURIComponent(c)}`,
    "PTT Kargo": (c) => `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${encodeURIComponent(c)}`,
    "UPS": (c) => `https://www.ups.com/track?tracknum=${encodeURIComponent(c)}&loc=tr_TR`,
    "DHL": (c) => `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${encodeURIComponent(c)}`,
    "FedEx": (c) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(c)}`,
}

const noParamCarriers = new Set(["Aras Kargo", "MNG Kargo"])

export function getTrackingUrl(carrier: string | undefined, trackingNumber: string): string | null {
    if (!carrier) return null
    const urlBuilder = carrierTrackingUrls[carrier]
    return urlBuilder ? urlBuilder(trackingNumber) : null
}

export function isNoParamCarrier(carrier: string | undefined): boolean {
    return carrier ? noParamCarriers.has(carrier) : false
}
