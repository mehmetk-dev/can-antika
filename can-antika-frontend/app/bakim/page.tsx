import type { Metadata } from "next"
import { Wrench, Clock } from "lucide-react"

import { getServerApiUrl } from "@/lib/server-api-url"
const API_URL = getServerApiUrl()

async function fetchSiteSettings() {
    try {
        const res = await fetch(`${API_URL}/v1/site-settings`, { next: { revalidate: 60 } })
        if (!res.ok) return null
        const json = await res.json()
        return json.data ?? null
    } catch {
        return null
    }
}

export const metadata: Metadata = {
    title: "Bakım Modu | Can Antika",
    description: "Sitemiz şu anda bakım modundadır. Kısa süre içinde geri döneceğiz.",
    robots: { index: false, follow: false },
}

export default async function MaintenancePage() {
    const s = await fetchSiteSettings()

    const storeName = s?.storeName || "Can Antika"
    const message = s?.maintenanceMessage || "Sitemiz şu anda bakım modundadır. Kısa süre içinde tekrar hizmetinizde olacağız."
    const phone = s?.phone || ""
    const email = s?.email || ""

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-primary text-primary-foreground px-4">
            {/* Dekoratif arka plan */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                }}
            />

            <div className="relative z-10 text-center max-w-lg">
                {/* İkon */}
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent/30 bg-accent/10 mb-8">
                    <Wrench className="h-12 w-12 text-accent animate-[spin_4s_linear_infinite]" />
                </div>

                {/* Marka */}
                <p className="text-sm uppercase tracking-[0.3em] text-accent mb-2">{storeName}</p>

                <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
                    Bakım Modu
                </h1>

                {/* Ayırıcı */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <span className="h-px w-16 bg-accent/40" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                    <span className="h-px w-16 bg-accent/40" />
                </div>

                <p className="text-lg text-primary-foreground/70 leading-relaxed mb-10">
                    {message}
                </p>

                {/* Bekleme göstergesi */}
                <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/50 mb-10">
                    <Clock className="h-4 w-4" />
                    <span>Kısa süre içinde geri döneceğiz...</span>
                </div>

                {/* İletişim */}
                {(phone || email) && (
                    <div className="border border-primary-foreground/10 rounded-lg p-6 bg-primary-foreground/5">
                        <p className="text-sm text-primary-foreground/60 mb-3">Acil durumlarda ulaşabilirsiniz:</p>
                        <div className="space-y-1">
                            {phone && (
                                <a href={`tel:${phone.replace(/\s/g, "")}`} className="block text-accent hover:underline font-medium">
                                    {phone}
                                </a>
                            )}
                            {email && (
                                <a href={`mailto:${email}`} className="block text-accent hover:underline text-sm">
                                    {email}
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
