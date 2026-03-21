"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { productApi } from "@/lib/api"
import type { ProductResponse } from "@/lib/types"

export function NewArrivals() {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    productApi
      .getAll(0, 8, "id", "desc")
      .then((data) => setProducts(data.items))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section className="relative bg-gradient-to-b from-amber-50 to-amber-100/50 py-24 lg:py-32 overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-amber-200/50 to-transparent" />
      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-amber-200/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div className="relative">
            <div className="flex items-center gap-4">
              <svg className="h-8 w-8 text-amber-600/60" viewBox="0 0 32 32">
                <path
                  d="M16,2 L16,6 M16,26 L16,30 M2,16 L6,16 M26,16 L30,16"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="16" cy="16" r="2" fill="currentColor" />
              </svg>
              <div>
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-amber-700">Yeni Gelenler</p>
                <h2 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-amber-950 sm:text-5xl">
                  Son Koleksiyon
                </h2>
              </div>
            </div>
            <svg className="mt-3 ml-12 h-4 w-40 text-amber-500/50" viewBox="0 0 160 16">
              <path d="M0,8 L60,8 M100,8 L160,8" stroke="currentColor" strokeWidth="1" />
              <path d="M60,8 Q80,0 80,8 T100,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="80" cy="8" r="3" fill="currentColor" />
            </svg>
          </div>
          <Link href="/urunler" className="hidden sm:block">
            <Button
              variant="ghost"
              className="group gap-2 font-serif text-amber-800 hover:text-amber-950 hover:bg-amber-200/50"
            >
              Tümünü Gör
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-14 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="mt-14 text-center py-16">
            <p className="font-serif text-amber-700">Henüz ürün eklenmemiş</p>
          </div>
        ) : (
          <div className="mt-8 sm:mt-14 grid grid-cols-2 gap-3 sm:gap-8 lg:grid-cols-4">
            {products.map((item) => {
              const era = (item.attributes?.era as string) || ""
              const imageUrl = item.imageUrls?.[0] || "/placeholder.svg"
              const isSold = (item.stock ?? 0) <= 0

              return (
                <Link key={item.id} href={`/urun/${item.slug ?? item.id}`} className="group relative">
                  <div className="relative overflow-hidden rounded-sm border-2 border-amber-300/50 bg-white shadow-lg transition-all duration-300 group-hover:border-amber-500 group-hover:shadow-xl group-hover:shadow-amber-200/50">
                    {/* Corner decorations */}
                    <div className="absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-amber-400/60" />
                    <div className="absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-amber-400/60" />
                    <div className="absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-amber-400/60" />
                    <div className="absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-amber-400/60" />

                    {/* Image */}
                    <div className="aspect-[4/5] overflow-hidden p-3">
                      <div className="relative h-full w-full overflow-hidden rounded-sm">
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          fill
                          unoptimized={true}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/40 via-transparent to-amber-50/10 mix-blend-multiply" />
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute left-5 top-5">
                      {!isSold ? (
                        <div className="flex items-center gap-1 sm:gap-1.5 rounded-sm border border-amber-600 bg-amber-50 px-1.5 py-0.5 sm:px-2.5 sm:py-1 shadow-sm">
                          <svg className="h-2 w-2 sm:h-3 sm:w-3 text-amber-700" viewBox="0 0 12 12">
                            <polygon
                              points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9 3,11 3.5,7.5 1,5 4.5,4.5"
                              fill="currentColor"
                            />
                          </svg>
                          <span className="font-serif text-[9px] sm:text-xs font-medium text-amber-800">Tek Ürün</span>
                        </div>
                      ) : (
                        <div className="rounded-sm border border-stone-400 bg-stone-100 px-1.5 py-0.5 sm:px-2.5 sm:py-1">
                          <span className="font-serif text-[9px] sm:text-xs font-medium text-stone-600">Satıldı</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="border-t border-amber-200/50 bg-gradient-to-b from-amber-50/80 to-white p-3 sm:p-4 flex flex-col justify-between h-full">
                      <div>
                        {era && <p className="font-serif text-[9px] sm:text-xs uppercase tracking-[0.2em] text-amber-600">{era}</p>}
                        <h3 className="mt-1 sm:mt-1.5 font-serif text-xs sm:text-lg font-medium text-amber-950 line-clamp-2 sm:line-clamp-1">{item.title}</h3>
                      </div>
                      <div className="mt-2 sm:mt-3 flex items-center justify-between">
                        <p className="font-serif text-sm sm:text-xl font-bold text-amber-800">
                          {isSold ? (
                            <span className="text-stone-400 line-through">₺{item.price.toLocaleString("tr-TR")}</span>
                          ) : (
                            `₺${item.price.toLocaleString("tr-TR")}`
                          )}
                        </p>
                        <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-700 transition-colors group-hover:bg-amber-600 group-hover:text-white shrink-0">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-10 text-center sm:hidden">
          <Link href="/urunler">
            <Button className="gap-2 bg-amber-800 font-serif text-amber-50 hover:bg-amber-900">
              Tümünü Gör
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
