import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProductResponse } from "@/lib/types"

interface RelatedProductsProps {
  products: ProductResponse[]
  currentProductId: number
}

export function RelatedProducts({ products, currentProductId }: RelatedProductsProps) {
  const relatedProducts = products.filter((p) => p.id !== currentProductId).slice(0, 4)

  if (relatedProducts.length === 0) return null

  return (
    <section className="border-t border-border bg-muted/30 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Benzer Ürünler
            </h2>
          </div>
          <Link href="/urunler" className="hidden sm:block">
            <Button variant="ghost" className="group gap-2 text-primary">
              Tümünü Gör
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((product) => (
            <Link
              key={product.id}
              href={`/urun/${product.slug ?? product.id}`}
              className="group relative overflow-hidden rounded-lg bg-card"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <Image
                  src={product.imageUrls?.[0] || "/placeholder.svg"}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <div className="p-4">
                {product.category?.name && (
                  <p className="text-xs uppercase tracking-wider text-accent">{product.category.name}</p>
                )}
                <h3 className="mt-1 font-serif text-base font-medium text-foreground line-clamp-1">{product.title}</h3>
                <p className="mt-2 font-semibold text-primary">₺{(product.price ?? 0).toLocaleString("tr-TR")}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
