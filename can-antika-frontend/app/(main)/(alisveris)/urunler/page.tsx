import type { Metadata } from "next"
import { cache } from "react"

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

const fetchInitialProducts = cache(async () => {
  return fetchApiDataWithFallback<CursorResponse<ProductResponse>>("/v1/product/search?page=0&size=20&sortBy=id&direction=desc", {
    revalidate: 60,
    timeoutMs: 3500,
  })
})

const fetchCategories = cache(async () => {
  return fetchApiDataWithFallback<CategoryResponse[]>("/v1/category/find-all", {
    revalidate: 300,
    timeoutMs: 2500,
  })
})

const fetchPeriods = cache(async () => {
  return fetchApiDataWithFallback<PeriodResponse[]>("/v1/period/find-all", {
    revalidate: 300,
    timeoutMs: 2500,
  })
})

export default async function CatalogPage() {
  const [productsResult, categoriesResult, periodsResult] = await Promise.allSettled([
    fetchInitialProducts(),
    fetchCategories(),
    fetchPeriods(),
  ])

  const initialData = productsResult.status === "fulfilled" && productsResult.value
    ? {
      items: Array.isArray(productsResult.value.items) ? productsResult.value.items : [],
      totalElement: typeof productsResult.value.totalElement === "number" ? productsResult.value.totalElement : 0,
    }
    : { items: [], totalElement: 0 }

  const initialCategories = categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value)
    ? categoriesResult.value
    : []

  const initialPeriods = periodsResult.status === "fulfilled" && Array.isArray(periodsResult.value)
    ? periodsResult.value
    : []

  return (
    <CatalogClient
      initialProducts={initialData.items}
      initialTotalCount={initialData.totalElement}
      initialCategories={initialCategories}
      initialPeriods={initialPeriods}
    />
  )
}
