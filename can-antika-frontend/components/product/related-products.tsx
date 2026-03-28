import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveImageUrl } from "@/lib/image-url"
import type { ProductResponse } from "@/lib/types"

interface RelatedProductsProps {
  products: ProductResponse[]
  currentProductId: number
}

export function RelatedProducts({ products, currentProductId }: RelatedProductsProps) {
  const relatedProducts = products.filter((p) => p.id !== currentProductId).slice(0, 4)

  if (relatedProducts.length === 0) return null

  return (
    <section className="relative overflow-hidden border-t border-border/60 bg-[linear-gradient(180deg,#f5f2ec_0%,#f0ebe2_44%,#ebe4d9_100%)] py-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-8%] h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-20 right-[-10%] h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%237B4019' stroke-opacity='0.35' stroke-width='0.8'%3E%3Crect x='12' y='12' width='96' height='96'/%3E%3Crect x='28' y='28' width='64' height='64'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "120px 120px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/70">Seçki</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Benzer Ürünler
            </h2>
          </div>
          <Link href="/urunler" className="hidden sm:block">
            <Button variant="ghost" className="group gap-2 rounded-full border border-primary/20 bg-background/60 px-5 text-primary backdrop-blur-sm hover:bg-background">
              Tümünü Gör
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {relatedProducts.map((product) => (
            <Link
              key={product.id}
              href={`/urun/${product.slug ?? product.id}`}
              className="group relative min-w-[78%] snap-start overflow-hidden rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,#fffaf3_0%,#f7f0e4_100%)] shadow-[0_12px_30px_rgba(56,34,18,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_18px_36px_rgba(56,34,18,0.16)] sm:min-w-0"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={resolveImageUrl(product.imageUrls?.[0])}
                  alt={product.title}
                  fill
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
                <div className="absolute inset-x-4 bottom-4 rounded-full border border-white/25 bg-black/30 px-3 py-1 text-center text-[11px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm">
                  Tek Parça Koleksiyon
                </div>
              </div>

              <div className="p-4">
                {product.category?.name && (
                  <p className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] uppercase tracking-wider text-primary/80">
                    {product.category.name}
                  </p>
                )}
                <h3 className="mt-2 line-clamp-2 font-serif text-[1.15rem] font-medium leading-snug text-foreground">
                  {product.title}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-serif text-xl font-semibold text-primary">₺{(product.price ?? 0).toLocaleString("tr-TR")}</p>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Detayı Gör</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
