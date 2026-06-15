import { memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { resolveImageUrl } from "@/lib/product/image-url"
import { getProductUrl } from "@/lib/product/product-url"
import { eraLabels, getProductAttributes } from "@/lib/product/product-utils"
import type { ProductCardResponse } from "@/lib/types"

interface RelatedProductsProps {
  products: ProductCardResponse[]
  currentProductId: number
}

function RelatedProductsInner({ products, currentProductId }: RelatedProductsProps) {
  const relatedProducts = products.filter((p) => p.id !== currentProductId).slice(0, 4)

  if (relatedProducts.length === 0) return null

  return (
    <section className="border-t border-border/60 bg-[#f6f3ed] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between sm:mb-8">
          <div>
            <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#8c7355]">
              Sizin için seçtik
            </p>
            <h2 className="mt-1.5 font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
              Benzer Eserler
            </h2>
          </div>
          <Link href="/urunler" prefetch={false} className="hidden sm:block">
            <Button variant="outline" className="h-10 rounded-none border-primary text-primary hover:bg-primary/5 px-5 font-sans text-xs uppercase tracking-widest font-semibold transition-all">
              Tümünü Gör
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {relatedProducts.map((product) => {
            const imageUrl = resolveImageUrl(product.imageUrls?.[0])
            const { era, condition, status } = getProductAttributes(product)
            const outOfStock = (product.stock ?? 0) <= 0
            const isSold = status === "sold" || outOfStock

            return (
              <Link
                key={product.id}
                href={getProductUrl(product)}
                prefetch={false}
                className="group flex h-full min-w-0 flex-col border border-border/80 bg-card p-2 hover:border-primary/30 hover:shadow-[0_12px_28px_rgba(123,64,25,0.05)] rounded-xl transition-all duration-300 relative"
              >
                {/* Delicate Gallery Corner Accents */}
                <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-accent/25 rounded-tl-[3px] pointer-events-none transition-colors group-hover:border-accent/60" />
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-accent/25 rounded-tr-[3px] pointer-events-none transition-colors group-hover:border-accent/60" />
                <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l border-accent/25 rounded-bl-[3px] pointer-events-none transition-colors group-hover:border-accent/60" />
                <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-accent/25 rounded-br-[3px] pointer-events-none transition-colors group-hover:border-accent/60" />

                {/* Görsel Alanı */}
                <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-background/40 rounded-lg border border-border/40">
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 47vw, (max-width: 1024px) 31vw, 24vw"
                    className="object-contain p-1.5 object-center transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
                  />
                  
                  {isSold && (
                    <div className="absolute left-2.5 top-2.5 z-20">
                      <span className="text-[9px] border border-destructive/20 text-destructive font-serif italic px-2 py-0.5 uppercase tracking-wider bg-destructive/10 rounded-sm">
                        Satıldı
                      </span>
                    </div>
                  )}
                </div>

                {/* Sergi Künyesi (Exhibit Placard) */}
                <div className="mt-2 flex grow flex-col items-center justify-between p-2 sm:p-3 bg-background/50 border border-border/50 rounded-lg relative text-center min-h-[110px] sm:min-h-[140px] transition-colors group-hover:bg-background/85">
                  {/* Fleuron Süsleme */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-card px-1 text-[8px] text-accent/80 font-serif">
                    ✦
                  </div>

                  <div className="flex flex-col items-center w-full">
                    {/* Kategori */}
                    {product.category?.name && (
                      <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8c7355] mb-1">
                        {product.category.name}
                      </span>
                    )}

                    {/* Ürün Başlığı */}
                    <h3 className="font-serif text-xs sm:text-sm font-normal leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {product.title}
                    </h3>

                    {/* Dönem ve Kondisyon Bilgileri */}
                    {(era || condition) && (
                      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 mt-1 sm:mt-2 text-center">
                        {era && (
                          <span className="text-[9px] sm:text-[10px] font-serif italic text-muted-foreground/80">
                            {eraLabels[era] || era}
                          </span>
                        )}
                        {era && condition && (
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground/40 font-light pointer-events-none">•</span>
                        )}
                        {condition && (
                          <span className="text-[9px] sm:text-[10px] font-serif italic text-muted-foreground/80">
                            {condition}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fiyat Bilgisi */}
                  <div className="w-full mt-2 pt-2 border-t border-border/50 flex flex-col items-center justify-center">
                    <span className="font-serif text-sm font-semibold text-primary tracking-tight">
                      {isSold ? (
                        <span className="text-muted-foreground/50 line-through">
                          ₺{(product.price ?? 0).toLocaleString("tr-TR")}
                        </span>
                      ) : (
                        `₺${(product.price ?? 0).toLocaleString("tr-TR")}`
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-6 sm:hidden">
          <Link href="/urunler" prefetch={false}>
            <Button variant="outline" className="w-full h-11 rounded-none border-primary text-primary hover:bg-primary/5 px-5 font-sans text-xs uppercase tracking-widest font-semibold transition-all">
              Tüm Eserleri Gör
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export const RelatedProducts = memo(RelatedProductsInner)

