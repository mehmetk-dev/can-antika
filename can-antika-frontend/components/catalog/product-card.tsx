"use client"

import { memo, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import { ProductFavoriteButton } from "@/components/catalog/product-favorite-button"
import { resolveImageUrl } from "@/lib/product/image-url"
import { getProductUrl } from "@/lib/product/product-url"
import { eraLabels, getProductAttributes } from "@/lib/product/product-utils"
import type { ProductCardResponse } from "@/lib/types"

interface ProductCardProps {
  product: ProductCardResponse
  isPriority?: boolean
}

export const ProductCard = memo(function ProductCard({ product, isPriority = false }: ProductCardProps) {
  const [imageErrored, setImageErrored] = useState(false)

  const imageUrl = resolveImageUrl(product.imageUrls?.[0])
  const { era, condition, status } = getProductAttributes(product)
  const outOfStock = (product.stock ?? 0) <= 0
  const isSold = status === "sold" || outOfStock

  return (
    <Link
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
      <div className="relative aspect-square sm:aspect-[3/4] overflow-hidden bg-background/40 rounded-lg border border-border/40">
        <Image
          src={imageErrored ? "/placeholder.svg" : imageUrl}
          alt={product.title}
          fill
          loading={isPriority ? "eager" : "lazy"}
          fetchPriority={isPriority ? "high" : "auto"}
          decoding="async"
          sizes="(max-width: 640px) 47vw, (max-width: 1024px) 31vw, 280px"
          className={`object-contain p-2 object-center transition-transform duration-500 will-change-transform group-hover:scale-[1.03] ${isSold ? "grayscale-[0.35] opacity-85" : ""}`}
          onError={() => setImageErrored(true)}
        />

        <ProductFavoriteButton
          productId={product.id}
          className="absolute right-2 top-2 z-20"
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
        <div className="flex flex-col items-center w-full">
          {/* Kategori */}
          {product.category?.name && (
            <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8c7355] mb-1">
              {product.category.name}
            </span>
          )}

          {/* Ürün Başlığı */}
          <h2 className="font-serif text-xs sm:text-sm font-normal leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {product.title}
          </h2>

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
})
