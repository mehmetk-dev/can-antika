"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { categoryApi, productApi } from "@/lib/api"
import type { CategoryResponse } from "@/lib/types"

// Fallback images for categories that don't have their own
const categoryImages: Record<string, string> = {
  mobilya: "/antique-mahogany-furniture-chest-cabinet-vintage-o.jpg",
  porselen: "/antique-porcelain-vase-tea-set-delicate-floral-pat.jpg",
  saatler: "/antique-grandfather-clock-pocket-watch-vintage-bra.jpg",
  halılar: "/antique-persian-rug-carpet-ornate-patterns-handwov.jpg",
  tablolar: "/antique-oil-painting-portrait-landscape-gold-frame.jpg",
}

function getCategoryImage(name: string): string {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(categoryImages)) {
    if (key.includes(k)) return v
  }
  return "/placeholder.svg"
}

export function CategoriesSection() {
  const [categories, setCategories] = useState<(CategoryResponse & { count: number; dynamicImage?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    categoryApi.getAll().then(async (cats) => {
      // Fetch product count and latest product image per category
      const withCounts = await Promise.all(
        cats.map(async (cat) => {
          try {
            const result = await productApi.search({ categoryId: cat.id, page: 0, size: 1, sortBy: "id", direction: "desc" })
            const latestProductImage = result.items[0]?.imageUrls?.[0]
            return {
              ...cat,
              count: result.totalElement,
              dynamicImage: latestProductImage
            }
          } catch {
            return { ...cat, count: 0, dynamicImage: undefined }
          }
        })
      )
      setCategories(withCounts.filter((c) => c.count > 0))
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <section className="relative bg-emerald-950 py-24 lg:py-32 overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      </section>
    )
  }

  if (categories.length === 0) return null

  return (
    <section className="relative bg-emerald-950 py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="vintage-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="currentColor" className="text-emerald-400" />
            <path d="M0,10 L20,10 M10,0 L10,20" stroke="currentColor" strokeWidth="0.3" className="text-emerald-400" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#vintage-pattern)" />
        </svg>
      </div>

      <div className="absolute left-0 top-1/2 h-px w-32 bg-gradient-to-r from-transparent to-emerald-600/30" />
      <div className="absolute right-0 top-1/2 h-px w-32 bg-gradient-to-l from-transparent to-emerald-600/30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500/60" />
            <svg className="h-10 w-10 text-emerald-500" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" fill="none" />
              <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M20,6 L20,10 M20,30 L20,34 M6,20 L10,20 M30,20 L34,20" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="4" fill="currentColor" />
            </svg>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500/60" />
          </div>
          <p className="mt-4 font-serif text-sm uppercase tracking-[0.3em] text-emerald-400">Koleksiyonlar</p>
          <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-emerald-50 sm:text-5xl">
            Kategorilere Göz Atın
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-emerald-200/70 text-pretty">
            Her kategoride özenle seçilmiş, tarihi değeri yüksek eşsiz parçalar sizi bekliyor.
          </p>
        </div>

        <div className="mt-10 sm:mt-16 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-5">
          {categories.slice(0, 5).map((category, index) => (
            <Link
              key={category.id}
              href={`/urunler?category=${encodeURIComponent(category.name)}`}
              className={`group relative overflow-hidden ${index === 0 ? "col-span-2 lg:row-span-2" : ""
                }`}
            >
              <div className="relative h-full overflow-hidden border-2 border-emerald-700/50 bg-emerald-900/30 transition-all duration-300 group-hover:border-emerald-500">
                <div className="absolute inset-2 border border-emerald-600/30 pointer-events-none z-10" />

                {/* Corner decorations */}
                {[
                  "left-4 top-4",
                  "right-4 top-4 rotate-90",
                  "bottom-4 left-4 -rotate-90",
                  "bottom-4 right-4 rotate-180",
                ].map((pos) => (
                  <div key={pos} className={`absolute ${pos} z-10`}>
                    <svg className="h-6 w-6 text-emerald-500/60" viewBox="0 0 24 24">
                      <path d="M0,12 Q0,0 12,0" fill="none" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="0" r="2" fill="currentColor" />
                      <circle cx="0" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </div>
                ))}

                <div className={`${categories.length === 5 && index === 0 ? "aspect-[4/5]" : "aspect-square"} overflow-hidden`}>
                  <Image
                    src={category.dynamicImage || getCategoryImage(category.name)}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/50 to-emerald-900/20 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/60 to-transparent" />
                    <span className="font-serif text-[10px] sm:text-xs uppercase tracking-widest text-emerald-400">
                      {category.count} ürün
                    </span>
                  </div>
                  <h3
                    className={`mt-1 sm:mt-2 font-serif font-semibold text-emerald-50 ${index === 0 ? "text-2xl sm:text-3xl lg:text-4xl" : "text-base sm:text-xl lg:text-2xl"}`}
                  >
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
