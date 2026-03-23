"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Grid3X3, LayoutGrid, SlidersHorizontal, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FilterSidebar } from "@/components/catalog/filter-sidebar"
import { ProductCard } from "@/components/catalog/product-card"
import { ActiveFilters } from "@/components/catalog/active-filters"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { productApi, categoryApi } from "@/lib/api"
import { priceRanges } from "@/lib/products"
import type { ProductResponse, CategoryResponse, CursorResponse } from "@/lib/types"

type ViewMode = "grid" | "large"

function VintageCorner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <path d="M0 40V20C0 8.954 8.954 0 20 0h20" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M0 35V25C0 14.507 8.507 6 19 6h16" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
      <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

// Sort mapping: frontend value -> API params
const SORT_MAP: Record<string, { sortBy: string; direction: string }> = {
  newest: { sortBy: "id", direction: "desc" },
  "price-asc": { sortBy: "price", direction: "asc" },
  "price-desc": { sortBy: "price", direction: "desc" },
  name: { sortBy: "title", direction: "asc" },
}

interface CatalogClientProps {
  initialProducts?: ProductResponse[]
  initialTotalCount?: number
  initialCategories?: CategoryResponse[]
}

export function CatalogClient({
  initialProducts = [],
  initialTotalCount = 0,
  initialCategories = [],
}: CatalogClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryParam = searchParams.get("category")
  const searchQuery = searchParams.get("q") || ""

  // Determine if we have server-provided data for the initial render
  const hasInitialData = initialProducts.length > 0

  // Data state -- seed with server data when available
  const [products, setProducts] = useState<ProductResponse[]>(initialProducts)
  const [categories, setCategories] = useState<CategoryResponse[]>(initialCategories)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [isLoading, setIsLoading] = useState(!hasInitialData)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  // Track whether any user interaction has occurred (filter, sort, page, search)
  const [userInteracted, setUserInteracted] = useState(false)

  // Filter state -- categories now stores category IDs as strings
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [] as string[],
    priceRanges: [] as string[],
  })
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Fetch categories on mount if not provided by server, then resolve URL param
  useEffect(() => {
    const resolveCategories = (cats: CategoryResponse[]) => {
      if (categoryParam) {
        const match = cats.find(
          (c) => c.name.toLowerCase() === categoryParam.toLowerCase() || c.id.toString() === categoryParam
        )
        if (match) {
          setSelectedFilters((prev) => ({ ...prev, categories: [match.id.toString()] }))
          setUserInteracted(true)
        }
      }
    }

    if (initialCategories.length > 0) {
      resolveCategories(initialCategories)
    } else {
      categoryApi.getAll().then((cats) => {
        setCategories(cats)
        resolveCategories(cats)
      }).catch((e) => console.error("Kategori yükleme hatası:", e))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam])

  // Reset page when search or category changes
  useEffect(() => {
    setPage(0)
  }, [searchQuery, categoryParam])

  // Fetch products when filters/sort/page change
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    const sort = SORT_MAP[sortBy] || SORT_MAP.newest

    // Price range
    let minPrice: number | undefined
    let maxPrice: number | undefined
    if (selectedFilters.priceRanges.length > 0) {
      const ranges = selectedFilters.priceRanges
        .map((v) => priceRanges.find((r) => r.value === v))
        .filter(Boolean) as (typeof priceRanges)[number][]
      minPrice = Math.min(...ranges.map((r) => r.min))
      const maxVals = ranges.map((r) => r.max).filter((v) => v !== Number.POSITIVE_INFINITY)
      maxPrice = maxVals.length > 0 ? Math.max(...maxVals) : undefined
    }

    // Category: filter value is already category ID
    const categoryId = selectedFilters.categories.length > 0
      ? Number(selectedFilters.categories[0])
      : undefined

    try {
      const result: CursorResponse<ProductResponse> = await productApi.search({
        title: searchQuery || undefined,
        categoryId,
        minPrice,
        maxPrice,
        page,
        size: PAGE_SIZE,
        sortBy: sort.sortBy,
        direction: sort.direction,
      })

      const items = Array.isArray(result.items) ? result.items : []
      const total = typeof result.totalElement === "number" ? result.totalElement : items.length
      setProducts(items)
      setTotalCount(total)
    } catch (searchError) {
      console.error("Product search endpoint failed, trying getAll fallback:", searchError)
      try {
        const fallbackResult = await productApi.getAll(page, PAGE_SIZE, sort.sortBy, sort.direction)
        const fallbackItems = Array.isArray(fallbackResult.items) ? fallbackResult.items : []
        const fallbackTotal =
          typeof fallbackResult.totalElement === "number" ? fallbackResult.totalElement : fallbackItems.length
        setProducts(fallbackItems)
        setTotalCount(fallbackTotal)
      } catch (fallbackError) {
        console.error("Product listing fallback failed:", fallbackError)
        setProducts([])
        setTotalCount(0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedFilters, sortBy, page, searchQuery])

  // Only fetch client-side when user has interacted OR when we don't have initial data
  useEffect(() => {
    if (!hasInitialData || userInteracted) {
      fetchProducts()
    }
  }, [fetchProducts, hasInitialData, userInteracted])

  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[filterType as keyof typeof prev]
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, [filterType]: updated }
    })
    setPage(0)
    setUserInteracted(true)
  }

  const handleClearFilters = () => {
    setSelectedFilters({
      categories: [],
      priceRanges: [],
    })
    setPage(0)
    setUserInteracted(true)
    // URL'deki ?q= ve ?category= parametrelerini de temizle
    router.replace("/urunler")
  }

  const handleSortChange = (v: string) => {
    setSortBy(v)
    setPage(0)
    setUserInteracted(true)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setUserInteracted(true)
  }

  const activeFilterCount =
    selectedFilters.categories.length +
    selectedFilters.priceRanges.length

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 relative">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="h-px w-8 bg-primary/40 hidden lg:block" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary/70">Koleksiyonumuz</span>
              <span className="h-px w-8 bg-primary/40 hidden lg:block" />
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Antika Hazineler
            </h1>
            <p className="mt-2 text-muted-foreground">{totalCount} eşsiz antika eser sizleri bekliyor</p>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <FilterSidebar
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isMobile={false}
              apiCategories={categories}
            />
          </aside>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-primary/10">
              <div className="flex items-center gap-4">
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button
                      variant="outline"
                      className="gap-2 border-primary/30 bg-gradient-to-b from-background to-muted/30 hover:bg-primary/5 hover:border-primary/50"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      <span className="font-serif">Filtrele</span>
                      {activeFilterCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-80 bg-gradient-to-b from-background via-background to-muted/20 p-0 z-[110]"
                  >
                    {/* Paper texture */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.03] z-0"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                      }}
                    />

                    {/* Decorative corners */}
                    <VintageCorner className="absolute top-4 left-4 h-8 w-8 text-primary/20 z-[1]" />
                    <VintageCorner className="absolute top-4 right-4 h-8 w-8 text-primary/20 -scale-x-100 z-[1]" />
                    <VintageCorner className="absolute bottom-4 left-4 h-8 w-8 text-primary/20 -scale-y-100 z-[1]" />
                    <VintageCorner className="absolute bottom-4 right-4 h-8 w-8 text-primary/20 scale-x-[-1] scale-y-[-1] z-[1]" />

                    <SheetHeader className="relative z-[2] border-b border-primary/10 px-6 py-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <SheetTitle className="font-serif text-xl text-foreground">Filtreler</SheetTitle>
                          <p className="text-xs text-muted-foreground mt-1">Koleksiyonu daraltın</p>
                        </div>
                        {activeFilterCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="text-accent hover:text-accent/80 font-serif"
                          >
                            Temizle
                          </Button>
                        )}
                      </div>
                    </SheetHeader>
                    <div className="relative z-[2] px-6 py-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                      <FilterSidebar
                        selectedFilters={selectedFilters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        isMobile={true}
                        apiCategories={categories}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <p className="text-sm text-muted-foreground hidden sm:block">
                  <span className="font-serif">{products.length}</span> ürün gösteriliyor
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-44 bg-transparent border-primary/20 hover:border-primary/40">
                    <SelectValue placeholder="Sıralama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">En Yeni</SelectItem>
                    <SelectItem value="price-asc">Fiyat: Düşükten Yükseğe</SelectItem>
                    <SelectItem value="price-desc">Fiyat: Yüksekten Düşüğe</SelectItem>
                    <SelectItem value="name">İsme Göre</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex items-center border border-primary/20 rounded-md overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-none ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span className="sr-only">Izgara görünümü</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-none ${viewMode === "large" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                    onClick={() => setViewMode("large")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="sr-only">Büyük görünüm</span>
                  </Button>
                </div>
              </div>
            </div>

            <ActiveFilters selectedFilters={selectedFilters} onRemoveFilter={handleFilterChange} apiCategories={categories} />

            <div className="relative min-h-[520px]">
              {products.length > 0 ? (
                <>
                  <div
                    className={`grid gap-6 transition-opacity ${isLoading ? "opacity-60" : "opacity-100"} ${
                      viewMode === "large" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => handlePageChange(page - 1)}
                        className="border-primary/30"
                      >
                        Önceki
                      </Button>
                      <span className="text-sm text-muted-foreground px-3">
                        {page + 1} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages - 1}
                        onClick={() => handlePageChange(page + 1)}
                        className="border-primary/30"
                      >
                        Sonraki
                      </Button>
                    </div>
                  )}
                </>
              ) : isLoading ? (
                <div
                  className={`grid gap-6 ${viewMode === "large" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"}`}
                >
                  {Array.from({ length: viewMode === "large" ? 4 : 6 }).map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-lg border border-primary/10 bg-card">
                      <div className="aspect-[3/4] animate-pulse bg-muted/60" />
                      <div className="space-y-3 p-4">
                        <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted/70" />
                        <div className="h-4 w-20 animate-pulse rounded bg-muted/70" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-primary/40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                      <path d="M8 11h6M11 8v6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="font-serif text-xl text-foreground">Ürün bulunamadı</p>
                  <p className="mt-2 text-muted-foreground">Filtrelerinizi değiştirmeyi deneyin</p>
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent border-primary/30 hover:bg-primary/5"
                    onClick={handleClearFilters}
                  >
                    Filtreleri Temizle
                  </Button>
                </div>
              )}

              {isLoading && products.length > 0 && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/35 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-card/90 px-4 py-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Ürünler güncelleniyor...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
