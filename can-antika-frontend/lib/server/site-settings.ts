import { cache } from "react"
import { fetchApiDataWithFallback } from "./server-api-fallback"
import type { SiteSettingsResponse } from "@/lib/types"

/**
 * Tek cache() instance — hem root layout hem main layout aynı request
 * içinde bu fonksiyonu çağırırsa, Next.js dedupe eder (tek fetch).
 */
export const fetchSiteSettings = cache(async () => {
    return fetchApiDataWithFallback<SiteSettingsResponse>("/v1/site-settings", {
        revalidate: 300,
        timeoutMs: 4000,
    })
})
