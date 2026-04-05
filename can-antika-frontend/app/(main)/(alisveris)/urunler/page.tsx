import type { Metadata } from "next"
import { cache } from "react"
import { Suspense } from "react"

import { CatalogClient } from "./catalog-client"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import type { ProductResponse, CategoryResponse, PeriodResponse, CursorResponse } from "@/lib/types"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Antika Koleksiyon",
  description:
    "Osmanlı, Viktoryen, Art Deco ve 19. yüzyıl antikalarını keşfedin. Uzman onaylı, tek ve özgün antika eserler. Mobilya, porselen, saatler, halılar ve daha fazlası.",
  keywords: [
    "antika",
    "antika mobilya",
    "osmanlı antika",
    "viktoryen antika",
    "art deco",
    "antika porselen",
    "antika saat",
    "antika halı",
    "istanbul antikacı",
  ],
  openGraph: {
    title: "Antika Koleksiyon | Can Antika",
    description: "Eşsiz antika eserleri keşfedin. Uzman onaylı, tek ve özgün parçalar.",
    type: "website",
    locale: "tr_TR",
  },
}

// Cache'li endpoint kullan — /v1/product search yerine listing (Redis cache'li)
const fetchInitialProducts = cache(async (filters?: { categoryId?: number; periodId?: number; title?: string }) => {
  if (filters && (filters.categoryId || filters.periodId || filters.title)) {
    const params = new URLSearchParams({ page: "0", size: "20", sortBy: "id", direction: "desc" })
    if (filters.categoryId) params.set("categoryId", filters.categoryId.toString())
    if (filters.periodId) params.set("periodId", filters.periodId.toString())
    if (filters.title) params.set("title", filters.title)
    return fetchApiDataWithFallback<CursorResponse<ProductResponse>>(`/v1/product/search?${params}`, {
      revalidate: 60,
      timeoutMs: 1500,
    })
  }
  return fetchApiDataWithFallback<CursorResponse<ProductResponse>>("/v1/product?page=0&size=20&sortBy=id&direction=desc", {
    revalidate: 60,
    timeoutMs: 1500,
  })
})

const fetchCategories = cache(async () => {
  return fetchApiDataWithFallback<CategoryResponse[]>("/v1/category/find-all", {
    revalidate: 300,
    timeoutMs: 1200,
  })
})

const fetchPeriods = cache(async () => {
  return fetchApiDataWithFallback<PeriodResponse[]>("/v1/period/find-all", {
    revalidate: 300,
    timeoutMs: 1200,
  })
})

function CatalogSkeleton() {
  return (
    <div className="bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-px w-8 bg-primary/40 hidden lg:block" />
            <span className="text-xs uppercase tracking-[0.2em] text-primary/70">Koleksiyonumuz</span>
            <span className="h-px w-8 bg-primary/40 hidden lg:block" />
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Antika Hazineler
          </h1>
          <p className="mt-2 text-muted-foreground">Koleksiyon yükleniyor…</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-primary/10 bg-card">
              <div className="aspect-[3/4] animate-pulse bg-muted/60" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted/70" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default async function CatalogPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Fetch categories and periods first (ISR-cached, near-instant after first load)
  const [categoriesResult, periodsResult] = await Promise.allSettled([
    fetchCategories(),
    fetchPeriods(),
  ])

  const initialCategories = categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value)
    ? categoriesResult.value
    : []

  const initialPeriods = periodsResult.status === "fulfilled" && Array.isArray(periodsResult.value)
    ? periodsResult.value
    : []

  // Resolve URL filter params to IDs
  const params = await searchParamsPromise
  const categoryParam = typeof params.category === "string" ? params.category : undefined
  const periodParam = typeof params.period === "string" ? params.period : undefined
  const searchQuery = typeof params.q === "string" ? params.q : undefined

  let ssrCategoryId: number | undefined
  if (categoryParam && initialCategories.length > 0) {
    const match = initialCategories.find(
      (c) => c.name.toLowerCase() === categoryParam.toLowerCase() || c.id.toString() === categoryParam
    )
    if (match) ssrCategoryId = match.id
  }

  let ssrPeriodId: number | undefined
  if (periodParam && initialPeriods.length > 0) {
    const match = initialPeriods.find(
      (p) => p.name.toLowerCase() === periodParam.toLowerCase() || p.id.toString() === periodParam
    )
    if (match) ssrPeriodId = match.id
  }

  // Fetch products — pre-filtered if URL has filters
  const productsResult = await fetchInitialProducts(
    (ssrCategoryId || ssrPeriodId || searchQuery)
      ? { categoryId: ssrCategoryId, periodId: ssrPeriodId, title: searchQuery }
      : undefined
  ).then(
    (value) => ({ status: "fulfilled" as const, value }),
    () => ({ status: "rejected" as const, value: null }),
  )

  const initialData = productsResult.status === "fulfilled" && productsResult.value
    ? {
      items: Array.isArray(productsResult.value.items) ? productsResult.value.items : [],
      totalElement: typeof productsResult.value.totalElement === "number" ? productsResult.value.totalElement : 0,
    }
    : { items: [], totalElement: 0 }

  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogClient
        initialProducts={initialData.items}
        initialTotalCount={initialData.totalElement}
        initialCategories={initialCategories}
        initialPeriods={initialPeriods}
        ssrCategoryId={ssrCategoryId?.toString()}
        ssrPeriodId={ssrPeriodId?.toString()}
      />
    </Suspense>
  )
}

