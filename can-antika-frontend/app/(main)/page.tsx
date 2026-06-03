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

const HOME_META_DESCRIPTION =
  "Can Antika, Beyoğlu Avrupa Pasajı'nda antika ve koleksiyon ürünleri sunar. Ürünleri, fiyatları, teslimat ve iade koşullarını siteden inceleyebilirsiniz."
const HOME_META_TITLE = "Can Antika | İstanbul Antika ve Koleksiyon Mağazası"

function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return <div className={`${height} w-full animate-pulse bg-muted/30 rounded-lg`} />
}

const fetchSiteSettings = cache(async () => {
  return fetchApiDataWithFallback<SiteSettingsResponse>("/v1/site-settings", {
    revalidate: 300,
    timeoutMs: 4000,
  })
})

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: HOME_META_TITLE },
    description: HOME_META_DESCRIPTION,
    openGraph: {
      title: HOME_META_TITLE,
      description: HOME_META_DESCRIPTION,
    },
    twitter: {
      title: HOME_META_TITLE,
      description: HOME_META_DESCRIPTION,
    },
  }
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
        <HeroSection />
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
