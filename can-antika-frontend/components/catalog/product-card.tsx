"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { resolveImageUrl } from "@/lib/image-url"
import { eraLabels, getProductAttributes } from "@/lib/product-utils"
import type { ProductResponse } from "@/lib/types"

interface ProductCardProps {
  product: ProductResponse
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageErrored, setImageErrored] = useState(false)

  const imageUrl = resolveImageUrl(product.imageUrls?.[0])
  const { era, condition, status } = getProductAttributes(product)
  const outOfStock = (product.stock ?? 0) <= 0
  const isSold = status === "sold" || outOfStock

  return (
    <Link
      href={`/urun/${product.slug ?? product.id}`}
      className="group relative block overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={imageErrored ? "/placeholder.svg" : imageUrl}
          alt={product.title}
          fill
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${isSold ? "grayscale opacity-60" : ""}`}
          onError={() => setImageErrored(true)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-9 w-9 rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="h-4 w-4" />
          <span className="sr-only">Favorilere ekle</span>
        </Button>

        <div className="absolute left-3 top-3">
          {!isSold ? (
            <Badge className="bg-primary text-primary-foreground shadow-sm">Tek Ürün</Badge>
          ) : (
            <Badge variant="secondary" className="bg-muted-foreground text-muted shadow-sm">
              {outOfStock && status !== "sold" ? "Tükendi" : "Satıldı"}
            </Badge>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 p-4">
        {era && <p className="text-xs font-medium uppercase tracking-wider text-accent">{eraLabels[era] || era}</p>}
        <h3 className="mt-1 line-clamp-2 font-serif text-lg font-medium leading-tight text-foreground transition-colors group-hover:text-primary">
          {product.title}
        </h3>
        {condition && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{condition}</p>}
        {product.category && <p className="mt-1 text-xs text-muted-foreground">{product.category.name}</p>}
        <div className="mt-3">
          {isSold ? (
            <p className="font-semibold text-muted-foreground line-through">₺{(product.price ?? 0).toLocaleString("tr-TR")}</p>
          ) : (
            <p className="font-semibold text-primary">₺{(product.price ?? 0).toLocaleString("tr-TR")}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
