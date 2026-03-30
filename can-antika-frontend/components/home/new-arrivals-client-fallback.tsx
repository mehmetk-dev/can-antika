"use client"

import { useEffect, useState } from "react"
import { productApi } from "@/lib/api"
import type { ProductResponse } from "@/lib/types"
import { NewArrivalsUI } from "./new-arrivals"

export function NewArrivalsClientFallback() {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productApi
      .getAll(0, 4, "id", "desc")
      .then((data) => {
        setProducts((data?.items ?? []).slice(0, 4))
      })
      .catch(() => {
        // silently fail
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-amber-100/50 py-24 lg:py-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-14">
            <div>
              <p className="font-serif text-sm uppercase tracking-[0.3em] text-amber-700">Yeni Gelenler</p>
              <h2 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-amber-950 sm:text-5xl">Son Koleksiyon</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-sm border-2 border-amber-300/50 bg-white shadow-lg">
                <div className="aspect-[4/5] animate-pulse bg-amber-100/60 p-3" />
                <div className="space-y-3 border-t border-amber-200/50 p-3 sm:p-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-amber-200/70" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-amber-200/70" />
                  <div className="h-5 w-24 animate-pulse rounded bg-amber-200/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) return null

  return <NewArrivalsUI products={products} />
}
