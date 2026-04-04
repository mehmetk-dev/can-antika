import { memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { resolveImageUrl } from "@/lib/product/image-url"
import { getProductUrl } from "@/lib/product/product-url"
import type { ProductResponse } from "@/lib/types"

interface RelatedProductsProps {
  products: ProductResponse[]
  currentProductId: number
}

function RelatedProductsInner({ products, currentProductId }: RelatedProductsProps) {
  const relatedProducts = products.filter((p) => p.id !== currentProductId).slice(0, 4)

  if (relatedProducts.length === 0) return null

  return (
    <section className="border-t border-border/60 bg-[#f6f3ed] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between sm:mb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/90 sm:text-xs">
              Sizin için seçtik
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-3xl">
              Benzer Ürünler
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Koleksiyona yakın öne çıkan parçalar
            </p>
          </div>
          <Link href="/urunler" prefetch={false} className="hidden sm:block">
            <Button variant="outline" className="group gap-2 rounded-full border-primary/25 bg-background px-5 text-primary hover:bg-primary/5">
              Tümünü Gör
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {relatedProducts.map((product) => {
            const imageUrl = resolveImageUrl(product.imageUrls?.[0])

            return (
              <Link
                key={product.id}
                href={getProductUrl(product)}
                prefetch={false}
                className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[0_6px_18px_rgba(33,24,14,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_14px_30px_rgba(33,24,14,0.14)]"
              >
                <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-[#f9f7f0]">
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 47vw, (max-width: 1024px) 31vw, 24vw"
                    className="object-cover object-center transition-transform duration-700 will-change-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
                </div>

                <div className="flex grow flex-col p-4">
                  <div className="mb-2 hidden sm:block">
                    {product.category?.name && (
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">
                        {product.category.name}
                      </p>
                    )}
                  </div>
                  <h3 className="line-clamp-2 font-serif text-base font-normal leading-tight text-foreground group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-sans text-sm font-medium text-foreground">
                      ₺{(product.price ?? 0).toLocaleString("tr-TR")}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-6 sm:hidden">
          <Link href="/urunler" prefetch={false}>
            <Button variant="outline" className="w-full gap-2 border-primary/25 bg-background text-primary hover:bg-primary/5">
              Tüm Ürünleri Gör
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export const RelatedProducts = memo(RelatedProductsInner)
