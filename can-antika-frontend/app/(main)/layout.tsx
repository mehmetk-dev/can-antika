
import { cache } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SitePopupWrapper } from "@/components/home/site-popup-wrapper"
import { LEGAL_BUSINESS_INFO } from "@/components/legal/business-info"
import { fetchSiteSettings } from "@/lib/server/site-settings"
import type { SiteSettingsResponse } from "@/lib/types"

const FOOTER_DEFAULTS: Pick<SiteSettingsResponse, "storeName" | "businessType" | "storeDescription" | "footerAbout" | "companyName" | "taxId" | "taxOffice" | "phone" | "email" | "address" | "facebook" | "instagram" | "twitter" | "youtube" | "tiktok"> = {
    storeName: "Can Antika",
    businessType: "Antika Eşya Satışı",
    storeDescription: "1982'den gelen aile tecrübesiyle Can Antika çatısı altında seçkin antika ve koleksiyon ürünleri sunuyoruz.",
    footerAbout: "",
    companyName: LEGAL_BUSINESS_INFO.companyName,
    taxId: LEGAL_BUSINESS_INFO.taxId,
    taxOffice: LEGAL_BUSINESS_INFO.taxOffice,
    phone: LEGAL_BUSINESS_INFO.phone,
    email: LEGAL_BUSINESS_INFO.email,
    address: LEGAL_BUSINESS_INFO.address,
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
}

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await fetchSiteSettings()

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer settings={settings ?? FOOTER_DEFAULTS as SiteSettingsResponse} />
            <SitePopupWrapper />
        </div>
    )
}
