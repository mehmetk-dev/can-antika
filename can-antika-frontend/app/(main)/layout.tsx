
import { cache } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SitePopupWrapper } from "@/components/home/site-popup-wrapper"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import type { SiteSettingsResponse } from "@/lib/types"

const fetchSiteSettings = cache(async () => {
    return fetchApiDataWithFallback<SiteSettingsResponse>("/v1/site-settings", {
        revalidate: 300,
        timeoutMs: 900,
    })
})

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
