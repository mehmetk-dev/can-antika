"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
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

export function CategoriesSectionClientFallback() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoryApi.getAll()
      .then((data) => {
        if (Array.isArray(data)) setCategories(data.slice(0, 4))
      })
      .catch(() => {
        // silent fail
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-[#2a1c12] py-24 lg:py-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d1a46e]/70" />
              <svg className="h-10 w-10 text-[#d1a46e]/90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="0.5" fill="none" />
                <circle cx="20" cy="20" r="4" fill="currentColor" />
              </svg>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d1a46e]/70" />
            </div>
            <p className="mt-4 font-serif text-sm uppercase tracking-[0.3em] text-[#e1bc8f]">Koleksiyonlar</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#f6e8d3] sm:text-5xl">Kategorilere Göz Atın</h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative overflow-hidden border-2 border-[#7d5534]/45 bg-[#3d281a]/45">
                <div className="aspect-[3/4] animate-pulse bg-[#4a3020]/40" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#7d5534]/40 mb-2" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-[#7d5534]/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-[#2a1c12] py-24 lg:py-32">
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
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={category.coverImageUrl ? resolveImageUrl(category.coverImageUrl) : getCategoryImage(category.name)}
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
                      Koleksiyon
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
