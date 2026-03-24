"use client"

import Link from "next/link"
import { ChevronRight, Heart, Share2, ShoppingBag, Check, Shield } from "lucide-react"
import { ImageGallery } from "@/components/product/image-gallery"
import { PurchaseDialog, ContactDialog } from "@/components/product/product-dialogs"
import { ProductReviews } from "@/components/product/product-reviews"
import { RelatedProducts } from "@/components/product/related-products"
import { WhatsAppButton } from "@/components/product/whatsapp-button"
import { TrustBadges } from "@/components/product/trust-badges"
import { QuantitySelector } from "@/components/product/quantity-selector"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProductActions } from "@/hooks/useProductActions"
import { getProductAttributes, eraLabels } from "@/lib/product-utils"
import type { ProductResponse } from "@/lib/types"

interface ProductDetailProps {
  product: ProductResponse
  relatedProducts?: ProductResponse[]
}

export function ProductDetail({ product, relatedProducts = [] }: ProductDetailProps) {
  const maxStock = product.stock ?? 1
  const { era, condition, dimensions, provenance, status } = getProductAttributes(product)
  const outOfStock = maxStock <= 0
  const productImages = product.imageUrls?.length ? product.imageUrls : ["/placeholder.svg"]

  const {
    quantity, setQuantity,
    addingToCart, addedToCart,
    addingToWishlist, addedToWishlist,
    handleAddToCart, handleAddToWishlist, handleShare,
  } = useProductActions(product, maxStock)

  return (
    <main className="overflow-x-hidden">
      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
        <ol className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-muted-foreground">
          <li><Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link></li>
          <ChevronRight className="h-4 w-4" />
          <li><Link href="/urunler" className="hover:text-primary transition-colors">Ürünler</Link></li>
          <ChevronRight className="h-4 w-4" />
          <li className="max-w-[150px] truncate font-medium text-foreground sm:max-w-[220px]">{product.title}</li>
        </ol>
      </nav>

      {/* Product Section */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ImageGallery images={productImages} productName={product.title} />

          <div className="min-w-0 flex flex-col">
            {/* Status Badge */}
            <div className="mb-4 flex items-center justify-between gap-3">
              {status !== "sold" ? (
                <Badge className="bg-primary text-primary-foreground">Tek Ürün</Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted-foreground text-muted">Satıldı</Badge>
              )}
              <p className="text-xs font-medium tracking-wide text-muted-foreground">CAN-{product.id.toString().padStart(4, "0")}</p>
            </div>

            {/* Title & Era */}
            {era && (
              <p className="font-serif text-sm uppercase tracking-[0.2em] text-accent">
                {eraLabels[era] || era}
              </p>
            )}
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
              {product.title}
            </h1>

            {product.category && (
              <p className="mt-1 text-sm text-muted-foreground">{product.category.name}</p>
            )}

            {/* Price */}
            <div className="mt-6">
              {status === "sold" ? (
                <p className="font-serif text-2xl font-semibold text-muted-foreground line-through">
                  ₺{(product.price ?? 0).toLocaleString("tr-TR")}
                </p>
              ) : (
                <p className="font-serif text-3xl font-semibold text-primary">
                  ₺{(product.price ?? 0).toLocaleString("tr-TR")}
                </p>
              )}
            </div>

            {product.description && (
              <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Quick Details */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {condition && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Durum</p>
                  <p className="mt-1 font-medium text-foreground">{condition}</p>
                </div>
              )}
              {dimensions && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Boyutlar</p>
                  <p className="mt-1 font-medium text-foreground">{dimensions}</p>
                </div>
              )}
            </div>

            {/* Stock Info & Quantity Selector */}
            {status !== "sold" && !outOfStock && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${maxStock > 5 ? "bg-emerald-500" : maxStock > 0 ? "bg-amber-500" : "bg-red-500"}`} />
                  <span className="text-muted-foreground">
                    {maxStock > 5 ? "Stokta" : `Son ${maxStock} ürün`}
                  </span>
                </div>
                <QuantitySelector max={maxStock} value={quantity} onChange={setQuantity} disabled={addedToCart} />
              </div>
            )}

            {/* CTA Buttons */}
            {status !== "sold" && !outOfStock && (
              <div className="mt-6 grid grid-cols-1 gap-2.5">
                <Button
                  className="min-h-11 w-full gap-2 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addedToCart ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                  {addingToCart ? "Ekleniyor..." : addedToCart ? "Sepete Eklendi" : `Sepete Ekle (${quantity} adet)`}
                </Button>

                <PurchaseDialog product={product} />
                <ContactDialog product={product} />
                <WhatsAppButton product={product} />
              </div>
            )}

            {(status === "sold" || outOfStock) && (
              <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                <p className="font-serif text-lg font-semibold text-destructive">Tükendi</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bu ürün şu an stokta bulunmamaktadır. Favorilerinize ekleyerek tekrar stoğa girdiğinde haberdar olabilirsiniz.
                </p>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="mt-4 flex gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={handleAddToWishlist}
                disabled={addingToWishlist}
              >
                <Heart className={`h-4 w-4 ${addedToWishlist ? "fill-red-500 text-red-500" : ""}`} />
                {addingToWishlist ? "Ekleniyor..." : addedToWishlist ? "Favorilerde" : "Favorilere Ekle"}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Paylaş
              </Button>
            </div>

            <Separator className="my-8" />

            <TrustBadges />
          </div>
        </div>

        {/* Detailed Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="h-auto w-full justify-start overflow-x-auto overflow-y-hidden border-b border-border bg-transparent p-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <TabsTrigger value="details" className="flex-none shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 font-serif data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-6">
                Detaylar
              </TabsTrigger>
              <TabsTrigger value="provenance" className="flex-none shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 font-serif data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-6">
                Hikaye & Köken
              </TabsTrigger>
              {condition && (
                <TabsTrigger value="condition" className="flex-none shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 font-serif data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-6">
                  Durum Raporu
                </TabsTrigger>
              )}
              <TabsTrigger value="reviews" className="flex-none shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 font-serif data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-6">
                Yorumlar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-8">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {era && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dönem</p>
                    <p className="mt-1 font-medium text-foreground">{eraLabels[era] || era}</p>
                  </div>
                )}
                {product.category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kategori</p>
                    <p className="mt-1 font-medium text-foreground">{product.category.name}</p>
                  </div>
                )}
                {dimensions && (
                  <div>
                    <p className="text-sm text-muted-foreground">Boyutlar</p>
                    <p className="mt-1 font-medium text-foreground">{dimensions}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Envanter No</p>
                  <p className="mt-1 font-medium text-foreground">CAN-{product.id.toString().padStart(4, "0")}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="provenance" className="mt-8">
              <div className="max-w-2xl">
                <h3 className="font-serif text-xl font-semibold text-foreground">Eserin Hikayesi</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {provenance || "Bu eser hakkında detaylı köken bilgisi için lütfen bizimle iletişime geçin. Uzman ekibimiz eserin tarihçesi hakkında size kapsamlı bilgi sunabilir."}
                </p>
                {product.description && (
                  <p className="mt-4 leading-relaxed text-muted-foreground">{product.description}</p>
                )}
              </div>
            </TabsContent>
            {condition && (
              <TabsContent value="condition" className="mt-8">
                <div className="max-w-2xl">
                  <h3 className="font-serif text-xl font-semibold text-foreground">Durum Değerlendirmesi</h3>
                  <div className="mt-4 rounded-lg border border-border bg-card p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Uzman Onaylı</p>
                        <p className="text-sm text-muted-foreground">Bu eser uzman ekibimiz tarafından incelenmiştir</p>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <p className="text-muted-foreground leading-relaxed">{condition}</p>
                  </div>
                </div>
              </TabsContent>
            )}
            <TabsContent value="reviews" className="mt-8">
              <ProductReviews productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <RelatedProducts products={relatedProducts} currentProductId={product.id} />
    </main>
  )
}
