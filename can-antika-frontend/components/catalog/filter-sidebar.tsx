"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { priceRanges } from "@/lib/product/products"
import type { CategoryResponse, PeriodResponse } from "@/lib/types"

interface FilterSidebarProps {
  selectedFilters: {
    categories: string[]
    periods: string[]
    priceRanges: string[]
  }
  onFilterChange: (filterType: string, value: string) => void
  onClearFilters: () => void
  isMobile?: boolean
  apiCategories: CategoryResponse[]
  apiPeriods: PeriodResponse[]
}

export function FilterSidebar({
  selectedFilters,
  onFilterChange,
  onClearFilters,
  isMobile = false,
  apiCategories,
  apiPeriods,
}: FilterSidebarProps) {
  const activeFilterCount =
    selectedFilters.categories.length +
    selectedFilters.periods.length +
    selectedFilters.priceRanges.length

  const content = (
    <Accordion type="multiple" defaultValue={["category"]} className="w-full">
      {/* Category Filter — DB'den gelen kategoriler */}
      <AccordionItem value="category" className="border-primary/10">
        <AccordionTrigger className="font-serif text-base hover:no-underline hover:text-primary py-3">
          Kategori
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2 pb-1 max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
            {apiCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 group">
                <Checkbox
                  id={`${isMobile ? "mobile-" : ""}category-${cat.id}`}
                  checked={selectedFilters.categories.includes(cat.id.toString())}
                  onCheckedChange={() => onFilterChange("categories", cat.id.toString())}
                  className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`${isMobile ? "mobile-" : ""}category-${cat.id}`}
                  className="cursor-pointer text-sm text-foreground group-hover:text-primary transition-colors"
                >
                  {cat.name}
                </Label>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="period" className="border-primary/10">
        <AccordionTrigger className="font-serif text-base hover:no-underline hover:text-primary py-3">
          Dönem
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2 pb-1 max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
            {apiPeriods.map((period) => (
              <div key={period.id} className="flex items-center gap-3 group">
                <Checkbox
                  id={`${isMobile ? "mobile-" : ""}period-${period.id}`}
                  checked={selectedFilters.periods.includes(period.id.toString())}
                  onCheckedChange={() => onFilterChange("periods", period.id.toString())}
                  className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`${isMobile ? "mobile-" : ""}period-${period.id}`}
                  className="cursor-pointer text-sm text-foreground group-hover:text-primary transition-colors"
                >
                  {period.name}
                </Label>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Price Range Filter */}
      <AccordionItem value="price" className="border-primary/10 border-b-0">
        <AccordionTrigger className="font-serif text-base hover:no-underline hover:text-primary py-3">
          Fiyat Aralığı
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2 pb-1">
            {priceRanges.map((range) => (
              <div key={range.value} className="flex items-center gap-3 group">
                <Checkbox
                  id={`${isMobile ? "mobile-" : ""}price-${range.value}`}
                  checked={selectedFilters.priceRanges.includes(range.value)}
                  onCheckedChange={() => onFilterChange("priceRanges", range.value)}
                  className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`${isMobile ? "mobile-" : ""}price-${range.value}`}
                  className="cursor-pointer text-sm text-foreground group-hover:text-primary transition-colors"
                >
                  {range.label}
                </Label>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )

  if (isMobile) {
    return content
  }

  return (
    <div className="sticky top-24">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary/10">
        <h2 className="font-serif text-lg font-semibold text-foreground">Filtreler</h2>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-accent hover:text-accent/80 h-auto p-0 font-serif text-sm"
          >
            Temizle
          </Button>
        )}
      </div>
      {content}
    </div>
  )
}
