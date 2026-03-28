import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cache, Suspense } from "react"

import { HeroSection } from "@/components/home/hero-section"
import { NewArrivals } from "@/components/home/new-arrivals"
import { CategoriesSection } from "@/components/home/categories-section"
import { TrustIndicators } from "@/components/home/trust-indicators"
import { FeaturedStory } from "@/components/home/featured-story"

import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import type { SiteSettingsResponse } from "@/lib/types"

function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return <div className={`${height} w-full animate-pulse bg-muted/30 rounded-lg`} />
}

const fetchSiteSettings = cache(async () => {
  return fetchApiDataWithFallback<SiteSettingsResponse>("/v1/site-settings", {
    revalidate: 60,
    timeoutMs: 1200,
  })
})

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
    <div>
      <main>
        <Suspense fallback={<SectionSkeleton height="h-[500px]" />}>
          <HeroSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton height="h-96" />}>
          <NewArrivals />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <CategoriesSection />
        </Suspense>
        <TrustIndicators />
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturedStory />
        </Suspense>
      </main>
    </div>
  )
}