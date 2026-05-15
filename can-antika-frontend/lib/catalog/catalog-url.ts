export const CATALOG_SORT_MAP = {
  newest: { sortBy: "createdAt", direction: "desc" },
  oldest: { sortBy: "createdAt", direction: "asc" },
  "price-asc": { sortBy: "price", direction: "asc" },
  "price-desc": { sortBy: "price", direction: "desc" },
  name: { sortBy: "title", direction: "asc" },
} as const

export type CatalogSortKey = keyof typeof CATALOG_SORT_MAP

export interface CatalogFilterSnapshot {
  categories: string[]
  periods: string[]
  priceRanges: string[]
  customMinPrice: string
  customMaxPrice: string
}

function singleFilterMatchesUrl(selectedIds: string[], urlId?: string): boolean {
  return urlId ? selectedIds.length === 1 && selectedIds[0] === urlId : selectedIds.length === 0
}

export function parseCatalogPageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(raw ?? "", 10)
  if (!Number.isFinite(parsed) || parsed <= 1) return 0
  return parsed - 1
}

export function parseCatalogSortParam(value: string | string[] | undefined): CatalogSortKey {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && raw in CATALOG_SORT_MAP ? (raw as CatalogSortKey) : "newest"
}

export function buildCatalogPageUrl(searchParams: URLSearchParams, newPage: number): string {
  const params = new URLSearchParams(searchParams.toString())
  const page = Math.max(0, Math.floor(newPage))

  if (page === 0) {
    params.delete("page")
  } else {
    params.set("page", String(page + 1))
  }

  const query = params.toString()
  return query ? `/urunler?${query}` : "/urunler"
}

export function areCatalogFiltersUrlBacked(
  filters: CatalogFilterSnapshot,
  urlFilters: { categoryId?: string; periodId?: string },
): boolean {
  return (
    singleFilterMatchesUrl(filters.categories, urlFilters.categoryId) &&
    singleFilterMatchesUrl(filters.periods, urlFilters.periodId) &&
    filters.priceRanges.length === 0 &&
    filters.customMinPrice.trim() === "" &&
    filters.customMaxPrice.trim() === ""
  )
}
