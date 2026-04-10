
import { cache } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SitePopupWrapper } from "@/components/home/site-popup-wrapper"
import { fetchSiteSettings } from "@/lib/server/site-settings"
import type { SiteSettingsResponse } from "@/lib/types"

const FOOTER_DEFAULTS: Pick<SiteSettingsResponse, "storeName" | "businessType" | "storeDescription" | "footerAbout" | "phone" | "email" | "address" | "facebook" | "instagram" | "twitter" | "youtube" | "tiktok"> = {
    storeName: "Can Antika",
    businessType: "Antika Eşya Satışı",
    storeDescription: "1989'den beri İstanbul'un kalbinde, geçmişin eşsiz güzelliklerini geleceğe taşıyoruz.",
    footerAbout: "",
    phone: "",
    email: "",
    address: "",
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
