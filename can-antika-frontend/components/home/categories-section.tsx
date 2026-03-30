"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"

import { categoryApi } from "@/lib/api"
import { resolveImageUrl } from "@/lib/product/image-url"
import type { CategoryResponse } from "@/lib/types"

const categoryImages: Record<string, string> = {
  mobilya: "/antique-mahogany-furniture-chest-cabinet-vintage-o.jpg",
  porselen: "/antique-porcelain-vase-tea-set-delicate-floral-pat.jpg",
  saatler: "/antique-grandfather-clock-pocket-watch-vintage-bra.jpg",
  halilar: "/antique-persian-rug-carpet-ornate-patterns-handwov.jpg",
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
  const [categories, setCategories] = useState<(CategoryResponse & { count: number | null; dynamicImage?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      try {
        const [cats, countsResponse] = await Promise.all([
          categoryApi.getAllCached(true),
          categoryApi.getProductCounts(true).catch(() => null),
        ])

        const countByCategory = new Map<number, number>()
        if (countsResponse) {
          Object.entries(countsResponse).forEach(([categoryId, count]) => {
            const parsedId = Number(categoryId)
            if (Number.isFinite(parsedId) && parsedId > 0) {
              countByCategory.set(parsedId, Number(count) || 0)
            }
          })
        }

        const visible = cats
          .map((cat) => ({
            ...cat,
            count: countByCategory.has(cat.id) ? (countByCategory.get(cat.id) ?? 0) : null,
            dynamicImage: cat.coverImageUrl ? resolveImageUrl(cat.coverImageUrl) : undefined,
          }))
          .filter((c) => c.count === null || c.count > 0)
          .slice(0, 4)

        if (isMounted) setCategories(visible)
      } catch {
        if (isMounted) setCategories([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <section className="relative overflow-hidden bg-[#2a1c12] py-24 lg:py-32">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#d1a46e]" />
        </div>
      </section>
    )
  }

  if (categories.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-[#2a1c12] py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(209,164,110,0.25),transparent_36%),radial-gradient(circle_at_88%_0%,rgba(165,112,66,0.2),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(80,49,27,0.4),transparent_40%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(28,18,12,0.2),rgba(28,18,12,0.62))]" />
      <div className="absolute left-0 top-1/2 h-px w-32 bg-gradient-to-r from-transparent to-[#d1a46e]/40" />
      <div className="absolute right-0 top-1/2 h-px w-32 bg-gradient-to-l from-transparent to-[#d1a46e]/40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d1a46e]/70" />
            <svg className="h-10 w-10 text-[#d1a46e]/90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" fill="none" />
              <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M20,6 L20,10 M20,30 L20,34 M6,20 L10,20 M30,20 L34,20" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="4" fill="currentColor" />
            </svg>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d1a46e]/70" />
          </div>
          <p className="mt-4 font-serif text-sm uppercase tracking-[0.3em] text-[#e1bc8f]">Koleksiyonlar</p>
          <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#f6e8d3] sm:text-5xl">Kategorilere Göz Atın</h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty font-serif text-[#e8cfad]/80">
            Her kategoride özenle seçilmiş, tarihi değeri yüksek eşsiz parçalar sizi bekliyor.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-6 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/urunler?category=${encodeURIComponent(category.name)}`} prefetch={false} className="group relative overflow-hidden">
              <div className="relative h-full overflow-hidden border-2 border-[#7d5534]/45 bg-[#3d281a]/45 transition-all duration-300 group-hover:border-[#d1a46e]/70">
                <div className="pointer-events-none absolute inset-2 z-10 border border-[#c39569]/30" />

                {[
                  "left-2 top-2",
                  "right-2 top-2 rotate-90",
                  "bottom-2 left-2 -rotate-90",
                  "bottom-2 right-2 rotate-180",
                ].map((pos) => (
                  <div key={pos} className={`absolute ${pos} z-10`}>
                    <svg className="h-4 w-4 text-[#d1a46e]/60" viewBox="0 0 24 24">
                      <path d="M0,12 Q0,0 12,0" fill="none" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="0" r="1.5" fill="currentColor" />
                      <circle cx="0" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                ))}

                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={category.dynamicImage || getCategoryImage(category.name)}
                    alt={category.name}
                    fill
                    unoptimized={true}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b120c] via-[#1f140d]/50 to-[#2f1f15]/20 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b120c]/90 via-transparent to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-[#d1a46e]/70 to-transparent" />
                    <span className="font-serif text-[10px] uppercase tracking-widest text-[#e6c49d] sm:text-xs">
                      {typeof category.count === "number" ? `${category.count} ürün` : "Koleksiyon"}
                    </span>
                  </div>
                  <h3 className="mt-1 font-serif text-base font-semibold text-[#f7ebd9] sm:mt-2 sm:text-xl lg:text-2xl">{category.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
