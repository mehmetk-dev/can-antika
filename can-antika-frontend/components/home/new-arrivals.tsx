import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { resolveImageUrl } from "@/lib/product/image-url"
import { getProductUrl } from "@/lib/product/product-url"
import { resolvePeriodLabel } from "@/lib/product/product-utils"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import type { ProductResponse, CursorResponse } from "@/lib/types"
import { NewArrivalsClientFallback } from "./new-arrivals-client-fallback"

export async function NewArrivals() {
  let products: ProductResponse[] = []

  try {
    const data = await fetchApiDataWithFallback<CursorResponse<ProductResponse>>(
      "/v1/product?page=0&size=4&sortBy=id&direction=desc",
      { revalidate: 120, timeoutMs: 1500 }
    )
    products = (data?.items ?? []).slice(0, 4)
  } catch {
    // Server-side fetch failed — client fallback will handle it
  }

  // Server-side veri gelemediyse client-side fallback kullan
  if (products.length === 0) {
    return <NewArrivalsClientFallback />
  }

  return <NewArrivalsUI products={products} />
}

export function NewArrivalsUI({ products }: { products: ProductResponse[] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-amber-100/50 py-24 lg:py-32">
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
                <path d="M16,2 L16,6 M16,26 L16,30 M2,16 L6,16 M26,16 L30,16" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="16" cy="16" r="2" fill="currentColor" />
              </svg>
              <div>
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-amber-700">Yeni Gelenler</p>
                <h2 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-amber-950 sm:text-5xl">Son Koleksiyon</h2>
              </div>
            </div>
            <svg className="ml-12 mt-3 h-4 w-40 text-amber-500/50" viewBox="0 0 160 16">
              <path d="M0,8 L60,8 M100,8 L160,8" stroke="currentColor" strokeWidth="1" />
              <path d="M60,8 Q80,0 80,8 T100,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="80" cy="8" r="3" fill="currentColor" />
            </svg>
          </div>
          <Link href="/urunler" className="hidden sm:block">
            <Button variant="ghost" className="group gap-2 font-serif text-amber-800 hover:bg-amber-200/50 hover:text-amber-950">
              Tümünü Gör
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-6 lg:grid-cols-4">
          {products.map((item) => {
            const era = resolvePeriodLabel(item)
            const imageUrl = resolveImageUrl(item.imageUrls?.[0])
            const isSold = (item.stock ?? 0) <= 0

            return (
              <Link key={item.id} href={getProductUrl(item)} className="group relative">
                <div className="relative overflow-hidden rounded-sm border-2 border-amber-300/50 bg-white shadow-lg transition-all duration-300 group-hover:border-amber-500 group-hover:shadow-xl group-hover:shadow-amber-200/50">
                  <div className="absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-amber-400/60" />
                  <div className="absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-amber-400/60" />
                  <div className="absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-amber-400/60" />
                  <div className="absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-amber-400/60" />

                  <div className="aspect-[4/5] overflow-hidden p-3">
                    <div className="relative h-full w-full overflow-hidden rounded-sm">
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        loading="lazy"
                        decoding="async"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/40 via-transparent to-amber-50/10 mix-blend-multiply" />
                    </div>
                  </div>

                  <div className="absolute left-5 top-5">
                    {!isSold ? (
                      <div className="flex items-center gap-1 rounded-sm border border-amber-600 bg-amber-50 px-1.5 py-0.5 shadow-sm sm:gap-1.5 sm:px-2.5 sm:py-1">
                        <svg className="h-2 w-2 text-amber-700 sm:h-3 sm:w-3" viewBox="0 0 12 12">
                          <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9 3,11 3.5,7.5 1,5 4.5,4.5" fill="currentColor" />
                        </svg>
                        <span className="font-serif text-[9px] font-medium text-amber-800 sm:text-xs">Tek Ürün</span>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-stone-400 bg-stone-100 px-1.5 py-0.5 sm:px-2.5 sm:py-1">
                        <span className="font-serif text-[9px] font-medium text-stone-600 sm:text-xs">Satıldı</span>
                      </div>
                    )}
                  </div>

                  <div className="flex h-full flex-col justify-between border-t border-amber-200/50 bg-gradient-to-b from-amber-50/80 to-white p-3 sm:p-4">
                    <div>
                      {era && <p className="font-serif text-[9px] uppercase tracking-[0.2em] text-amber-600 sm:text-xs">{era}</p>}
                      <h3 className="mt-1 line-clamp-2 font-serif text-xs font-medium text-amber-950 sm:mt-1.5 sm:line-clamp-1 sm:text-lg">{item.title}</h3>
                    </div>
                    <div className="mt-2 flex items-center justify-between sm:mt-3">
                      <p className="font-serif text-sm font-bold text-amber-800 sm:text-xl">
                        {isSold ? <span className="text-stone-400 line-through">₺{item.price.toLocaleString("tr-TR")}</span> : `₺${item.price.toLocaleString("tr-TR")}`}
                      </p>
                      <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-700 transition-colors group-hover:bg-amber-600 group-hover:text-white sm:flex">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

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
