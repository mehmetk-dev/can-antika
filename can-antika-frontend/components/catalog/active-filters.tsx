"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { priceRanges } from "@/lib/product/products"
import type { CategoryResponse, PeriodResponse } from "@/lib/types"

interface ActiveFiltersProps {
  selectedFilters: {
    categories: string[]
    periods: string[]
    priceRanges: string[]
  }
  onRemoveFilter: (filterType: string, value: string) => void
  apiCategories?: CategoryResponse[]
  apiPeriods?: PeriodResponse[]
}

export function ActiveFilters({
  selectedFilters,
  onRemoveFilter,
  apiCategories = [],
  apiPeriods = [],
}: ActiveFiltersProps) {
  const getLabel = (type: string, value: string) => {
    switch (type) {
      case "categories":
        return apiCategories.find((c) => c.id.toString() === value)?.name || value
      case "periods":
        return apiPeriods.find((p) => p.id.toString() === value)?.name || value
      case "priceRanges":
        return priceRanges.find((p) => p.value === value)?.label
      default:
        return value
    }
  }

  const allFilters = [
    ...selectedFilters.categories.map((v) => ({ type: "categories", value: v })),
    ...selectedFilters.periods.map((v) => ({ type: "periods", value: v })),
    ...selectedFilters.priceRanges.map((v) => ({ type: "priceRanges", value: v })),
  ]

  if (allFilters.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {allFilters.map((filter) => (
        <Badge
          key={`${filter.type}-${filter.value}`}
          variant="secondary"
          className="gap-1 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer pr-1"
          onClick={() => onRemoveFilter(filter.type, filter.value)}
        >
          {getLabel(filter.type, filter.value)}
          <X className="h-3 w-3" />
        </Badge>
      ))}
    </div>
  )
}
