import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cache } from "react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { NewArrivals } from "@/components/new-arrivals"
import { CategoriesSection } from "@/components/categories-section"
import { TrustIndicators } from "@/components/trust-indicators"
import { FeaturedStory } from "@/components/featured-story"

import { fetchApiDataWithFallback } from "@/lib/server-api-fallback"
import type { SiteSettingsResponse } from "@/lib/types"

const fetchSiteSettings = cache(async () => {
  return fetchApiDataWithFallback<SiteSettingsResponse>("/v1/site-settings", {
    revalidate: 60,
    timeoutMs: 1200,
  })
})

export async function generateMetadata(): Promise<Metadata> {
  const s = await fetchSiteSettings()
  const storeName = s?.storeName || "Can Antika"
  const storeDesc = s?.storeDescription || "1990'dan beri Istanbul'un en guvenilir antika magazasi."
  const metaTitle = s?.metaTitle || `${storeName} | Gecmisin Zarafeti`
  const metaDesc = s?.metaDescription || storeDesc

  return { title: metaTitle, description: metaDesc }
}

export default async function HomePage() {
  const s = await fetchSiteSettings()

  // Bakim modu aciksa /bakim sayfasina yonlendir
  if (s?.maintenanceMode === true) {
    redirect("/bakim")
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <NewArrivals />
        <CategoriesSection />
        <TrustIndicators />
        <FeaturedStory />
      </main>
      <Footer />
    </div>
  )
}
