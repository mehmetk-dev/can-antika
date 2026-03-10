import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { NewArrivals } from "@/components/new-arrivals"
import { CategoriesSection } from "@/components/categories-section"
import { TrustIndicators } from "@/components/trust-indicators"
import { FeaturedStory } from "@/components/featured-story"

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

export async function generateMetadata(): Promise<Metadata> {
  const s = await fetchSiteSettings()
  const storeName = s?.storeName || "Can Antika"
  const storeDesc = s?.storeDescription || "1990'dan beri İstanbul'un en güvenilir antika mağazası."
  const metaTitle = s?.metaTitle || `${storeName} | Geçmişin Zarafeti`
  const metaDesc = s?.metaDescription || storeDesc

  return { title: metaTitle, description: metaDesc }
}

export default async function HomePage() {
  const s = await fetchSiteSettings()

  // Bakım modu açıksa /bakim sayfasına yönlendir
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
