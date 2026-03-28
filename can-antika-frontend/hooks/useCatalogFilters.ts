"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { productApi, categoryApi, periodApi } from "@/lib/api"
import { priceRanges } from "@/lib/product/products"
import type { ProductResponse, CategoryResponse, CursorResponse, PeriodResponse } from "@/lib/types"
import { CATALOG_PAGE_SIZE } from "@/lib/constants"

const PAGE_SIZE = CATALOG_PAGE_SIZE

const SORT_MAP: Record<string, { sortBy: string; direction: string }> = {
    newest: { sortBy: "id", direction: "desc" },
    "price-asc": { sortBy: "price", direction: "asc" },
    "price-desc": { sortBy: "price", direction: "desc" },
    name: { sortBy: "title", direction: "asc" },
}

interface UseCatalogFiltersOptions {
    initialProducts?: ProductResponse[]
    initialTotalCount?: number
    initialCategories?: CategoryResponse[]
    initialPeriods?: PeriodResponse[]
}

export function useCatalogFilters({
    initialProducts = [],
    initialTotalCount = 0,
    initialCategories = [],
    initialPeriods = [],
}: UseCatalogFiltersOptions) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const categoryParam = searchParams.get("category")
    const periodParam = searchParams.get("period")
    const searchQuery = searchParams.get("q") || ""

    const hasInitialData = initialProducts.length > 0

    // Data state
    const [products, setProducts] = useState<ProductResponse[]>(initialProducts)
    const [categories, setCategories] = useState<CategoryResponse[]>(initialCategories)
    const [periods, setPeriods] = useState<PeriodResponse[]>(initialPeriods)
    const [totalCount, setTotalCount] = useState(initialTotalCount)
    const [isLoading, setIsLoading] = useState(!hasInitialData)
    const [page, setPage] = useState(0)

    const [userInteracted, setUserInteracted] = useState(false)
    const initialLoadSkipped = useRef(false)

    // Filter state
    const [selectedFilters, setSelectedFilters] = useState({
        categories: [] as string[],
        periods: [] as string[],
        priceRanges: [] as string[],
    })
    const [sortBy, setSortBy] = useState("newest")

    // Resolve URL category param
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
            categoryApi.getAllCached().then((cats) => {
                setCategories(cats)
                resolveCategories(cats)
            }).catch((e) => console.error("Kategori yükleme hatası:", e))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryParam])

    // Resolve URL period param
    useEffect(() => {
        if (initialPeriods.length > 0) {
            if (!periodParam) return
            const match = initialPeriods.find(
                (p) => p.name.toLowerCase() === periodParam.toLowerCase() || p.id.toString() === periodParam
            )
            if (match) {
                setSelectedFilters((prev) => ({ ...prev, periods: [match.id.toString()] }))
                setUserInteracted(true)
            }
            return
        }
        periodApi
            .getAll()
            .then((dbPeriods) => {
                setPeriods(dbPeriods)
                if (!periodParam) return
                const match = dbPeriods.find(
                    (p) => p.name.toLowerCase() === periodParam.toLowerCase() || p.id.toString() === periodParam
                )
                if (match) {
                    setSelectedFilters((prev) => ({ ...prev, periods: [match.id.toString()] }))
                    setUserInteracted(true)
                }
            })
            .catch((e) => console.error("Dönem yükleme hatası:", e))
    }, [periodParam, initialPeriods])

    // Reset page when search or category changes
    useEffect(() => {
        setPage(0)
    }, [searchQuery, categoryParam, periodParam])

    // Refs for stable fetch callback
    const filtersRef = useRef(selectedFilters)
    filtersRef.current = selectedFilters
    const sortByRef = useRef(sortBy)
    sortByRef.current = sortBy
    const pageRef = useRef(page)
    pageRef.current = page
    const searchQueryRef = useRef(searchQuery)
    searchQueryRef.current = searchQuery

    const [fetchTrigger, setFetchTrigger] = useState(0)

    const fetchProducts = useCallback(async () => {
        setIsLoading(true)
        const currentFilters = filtersRef.current
        const currentSortBy = sortByRef.current
        const currentPage = pageRef.current
        const currentSearch = searchQueryRef.current
        const sort = SORT_MAP[currentSortBy] || SORT_MAP.newest

        let minPrice: number | undefined
        let maxPrice: number | undefined
        if (currentFilters.priceRanges.length > 0) {
            const ranges = currentFilters.priceRanges
                .map((v) => priceRanges.find((r) => r.value === v))
                .filter(Boolean) as (typeof priceRanges)[number][]
            minPrice = Math.min(...ranges.map((r) => r.min))
            const maxVals = ranges.map((r) => r.max).filter((v) => v !== Number.POSITIVE_INFINITY)
            maxPrice = maxVals.length > 0 ? Math.max(...maxVals) : undefined
        }

        const selectedCategoryIds = currentFilters.categories
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v))
        const categoryId = selectedCategoryIds.length === 1 ? selectedCategoryIds[0] : undefined
        const categoryIds = selectedCategoryIds.length > 1 ? selectedCategoryIds.join(",") : undefined
        const selectedPeriodIds = currentFilters.periods
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v))
        const periodId = selectedPeriodIds.length === 1 ? selectedPeriodIds[0] : undefined
        const periodIds = selectedPeriodIds.length > 1 ? selectedPeriodIds.join(",") : undefined

        try {
            const result: CursorResponse<ProductResponse> = await productApi.search({
                title: currentSearch || undefined,
                categoryId,
                categoryIds,
                periodId,
                periodIds,
                minPrice,
                maxPrice,
                page: currentPage,
                size: PAGE_SIZE,
                sortBy: sort.sortBy,
                direction: sort.direction,
            })

            const items = Array.isArray(result.items) ? result.items : []
            const total = typeof result.totalElement === "number" ? result.totalElement : items.length
            setProducts(items)
            setTotalCount(total)
        } catch (searchError) {
            console.error("Product search endpoint failed:", searchError)
            const hasActiveFilters = !!(currentSearch || categoryId || categoryIds || periodId || periodIds || minPrice || maxPrice)
            if (hasActiveFilters) {
                toast.error("Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.")
                setProducts([])
                setTotalCount(0)
            } else {
                try {
                    const fallbackResult = await productApi.getAll(currentPage, PAGE_SIZE, sort.sortBy, sort.direction)
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
            }
        } finally {
            setIsLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchTrigger])

    useEffect(() => {
        if (!hasInitialData || userInteracted) {
            fetchProducts()
        }
    }, [fetchProducts, hasInitialData, userInteracted])

    // Handlers
    const handleFilterChange = (filterType: string, value: string) => {
        setSelectedFilters((prev) => {
            const current = prev[filterType as keyof typeof prev]
            const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
            return { ...prev, [filterType]: updated }
        })
        setPage(0)
        setUserInteracted(true)
        setFetchTrigger((c) => c + 1)
    }

    const handleClearFilters = () => {
        setSelectedFilters({
            categories: [],
            periods: [],
            priceRanges: [],
        })
        setPage(0)
        setUserInteracted(true)
        setFetchTrigger((c) => c + 1)
        router.replace("/urunler")
    }

    const handleSortChange = (v: string) => {
        setSortBy(v)
        setPage(0)
        setUserInteracted(true)
        setFetchTrigger((c) => c + 1)
    }

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
        setUserInteracted(true)
        setFetchTrigger((c) => c + 1)
    }

    const activeFilterCount =
        selectedFilters.categories.length +
        selectedFilters.periods.length +
        selectedFilters.priceRanges.length

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    return {
        products,
        categories,
        periods,
        totalCount,
        isLoading,
        page,
        totalPages,
        selectedFilters,
        sortBy,
        activeFilterCount,
        handleFilterChange,
        handleClearFilters,
        handleSortChange,
        handlePageChange,
    }
}
