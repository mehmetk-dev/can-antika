import type { Metadata } from "next"
import { cache } from "react"

import { CatalogClient } from "./catalog-client"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import type { ProductCardResponse, CategoryResponse, PeriodResponse, CursorResponse } from "@/lib/types"

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
    return fetchApiDataWithFallback<CursorResponse<ProductCardResponse>>(`/v1/product/search/cards?${params}`, {
      revalidate: 60,
      timeoutMs: 800,
    })
  }
  return fetchApiDataWithFallback<CursorResponse<ProductCardResponse>>("/v1/product/cards?page=0&size=20&sortBy=id&direction=desc", {
    revalidate: 60,
    timeoutMs: 800,
  })
})

const fetchCategories = cache(async () => {
  return fetchApiDataWithFallback<CategoryResponse[]>("/v1/category/find-all", {
    revalidate: 300,
    timeoutMs: 600,
  })
})

const fetchPeriods = cache(async () => {
  return fetchApiDataWithFallback<PeriodResponse[]>("/v1/period/find-all", {
    revalidate: 300,
    timeoutMs: 600,
  })
})

export default async function CatalogPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParamsPromise
  const categoryParam = typeof params.category === "string" ? params.category : undefined
  const periodParam = typeof params.period === "string" ? params.period : undefined
  const searchQuery = typeof params.q === "string" ? params.q : undefined
  const hasFilters = !!(categoryParam || periodParam || searchQuery)

  if (hasFilters) {
    // Filtre varsa: önce kategori/dönem çöz, sonra ürünleri getir
    const [categoriesResult, periodsResult] = await Promise.allSettled([
      fetchCategories(),
      fetchPeriods(),
    ])

    const initialCategories = categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value)
      ? categoriesResult.value : []
    const initialPeriods = periodsResult.status === "fulfilled" && Array.isArray(periodsResult.value)
      ? periodsResult.value : []

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

    const productsResult = await fetchInitialProducts(
      { categoryId: ssrCategoryId, periodId: ssrPeriodId, title: searchQuery }
    ).then(
      (value) => ({ status: "fulfilled" as const, value }),
      () => ({ status: "rejected" as const, value: null }),
    )

    const initialData = productsResult.status === "fulfilled" && productsResult.value
      ? { items: Array.isArray(productsResult.value.items) ? productsResult.value.items : [], totalElement: typeof productsResult.value.totalElement === "number" ? productsResult.value.totalElement : 0 }
      : { items: [], totalElement: 0 }

    return (
      <CatalogClient
        initialProducts={initialData.items}
        initialTotalCount={initialData.totalElement}
        initialFetchCompleted={productsResult.status === "fulfilled" && Boolean(productsResult.value)}
        initialCategories={initialCategories}
        initialPeriods={initialPeriods}
        ssrCategoryId={ssrCategoryId?.toString()}
        ssrPeriodId={ssrPeriodId?.toString()}
      />
    )
  }

  // Filtre yok (en yaygın durum): ürün + kategori + dönem paralel fetch
  const [categoriesResult, periodsResult, productsResult] = await Promise.allSettled([
    fetchCategories(),
    fetchPeriods(),
    fetchInitialProducts(),
  ])

  const initialCategories = categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value)
    ? categoriesResult.value : []
  const initialPeriods = periodsResult.status === "fulfilled" && Array.isArray(periodsResult.value)
    ? periodsResult.value : []

  const productsValue = productsResult.status === "fulfilled" ? productsResult.value : null
  const initialData = productsValue
    ? { items: Array.isArray(productsValue.items) ? productsValue.items : [], totalElement: typeof productsValue.totalElement === "number" ? productsValue.totalElement : 0 }
    : { items: [], totalElement: 0 }

  return (
    <CatalogClient
      initialProducts={initialData.items}
      initialTotalCount={initialData.totalElement}
      initialFetchCompleted={productsValue !== null}
      initialCategories={initialCategories}
      initialPeriods={initialPeriods}
      ssrCategoryId={undefined}
      ssrPeriodId={undefined}
    />
  )
}

