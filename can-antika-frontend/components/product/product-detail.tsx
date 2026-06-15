"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ChevronRight, Heart, Share2, ShoppingBag, Check, Shield, Package, ShieldCheck, Lock } from "lucide-react"
import { ImageGallery } from "@/components/product/image-gallery"
import { QuantitySelector } from "@/components/product/quantity-selector"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useProductActions } from "@/hooks/useProductActions"
import { getProductAttributes, eraLabels } from "@/lib/product/product-utils"
import type { ProductResponse, ProductCardResponse } from "@/lib/types"

const PurchaseDialog = dynamic(() => import("@/components/product/product-dialogs").then(m => ({ default: m.PurchaseDialog })))
const ContactDialog = dynamic(() => import("@/components/product/product-dialogs").then(m => ({ default: m.ContactDialog })))
const ProductReviews = dynamic(() => import("@/components/product/product-reviews").then(m => ({ default: m.ProductReviews })), {
  loading: () => <div className="min-h-[280px]" />,
})
const RelatedProducts = dynamic(() => import("@/components/product/related-products").then(m => ({ default: m.RelatedProducts })))
const WhatsAppButton = dynamic(() => import("@/components/product/whatsapp-button").then(m => ({ default: m.WhatsAppButton })))

interface ProductDetailProps {
  product: ProductResponse
  relatedProducts?: ProductCardResponse[]
}

const attributeLabels: Record<string, string> = {
  material: "Materyal",
  conditiondetails: "Kondisyon Detayı",
}

function getAttributeLabel(key: string): string {
  return attributeLabels[key.toLowerCase()] ?? key
}

export function ProductDetail({ product, relatedProducts = [] }: ProductDetailProps) {

  const maxStock = useMemo(() => Math.max(product.stock ?? 0, 0), [product.stock])
  const { era, condition, conditionDetails, dimensions, material, provenance, authenticityNote, status } = useMemo(() => getProductAttributes(product), [product])
  const outOfStock = maxStock <= 0
  const isSold = status === "sold" || outOfStock
  const productImages = useMemo(() => product.imageUrls?.length ? product.imageUrls : ["/placeholder.svg"], [product.imageUrls])

  const otherAttributes = useMemo(() => {
    if (!product.attributes || typeof product.attributes !== 'object') return []
    const excludedKeys = ['status', 'condition', 'conditionDetails', 'dimensions', 'material', 'provenance', 'authenticityNote', 'era', 'period', 'periodName', 'period_name', 'donem', 'dönem']
    return Object.entries(product.attributes)
      .filter(([key, value]) => !excludedKeys.includes(key) && (typeof value === 'string' || typeof value === 'number') && String(value).trim() !== '')
      .map(([key, value]) => ({ key, value: String(value) }))
  }, [product.attributes])

  const {
    quantity, setQuantity,
    addingToCart, addedToCart,
    addingToWishlist, addedToWishlist,
    handleAddToCart, handleAddToWishlist, handleShare,
  } = useProductActions(product, maxStock)

  return (
    <main className="overflow-x-hidden">
      {/* Breadcrumb */}
      <nav className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
        <ol className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-muted-foreground">
          <li><Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
          <li><Link href="/urunler" className="hover:text-primary transition-colors">Ürünler</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
          <li className="max-w-[150px] truncate font-medium text-foreground sm:max-w-[220px]">{product.title}</li>
        </ol>
      </nav>

      {/* Product Section */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-12 items-start">
          <div className="relative min-w-0 w-full max-w-[550px] md:max-w-[600px] lg:max-w-none mx-auto">
            <ImageGallery images={productImages} productName={product.title} />
          </div>

          <div className="min-w-0 w-full max-w-[550px] md:max-w-[600px] lg:max-w-none mx-auto flex flex-col pt-2 lg:pt-0">
            {/* Sergi Künyesi (Antique Exhibit Placard Frame) */}
            <div className="bg-card/30 border-2 border-primary/10 outline outline-1 outline-offset-[-6px] outline-accent/25 p-6 relative rounded-lg font-serif">
              {/* Top Center Frame Label */}
              <div className="absolute -top-2.5 left-6 bg-background px-3 font-serif text-[10px] uppercase tracking-[0.25em] text-[#8c7355] border border-border/70 rounded-sm">
                Eser Detayları
              </div>

              {/* Header Info: Category and Status on Left, Price on Right */}
              <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-border/30 pb-3 mt-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#8c7355]">
                    {product.category?.name || "Eşsiz Eser"}
                  </span>
                  {!isSold ? (
                    maxStock === 1 ? (
                      <span className="text-[9px] border border-accent/35 text-primary font-serif italic px-2 py-0.5 uppercase tracking-wider bg-card/90 rounded-sm">Tek Eser</span>
                    ) : null
                  ) : (
                    <span className="text-[9px] border border-destructive/20 text-destructive font-serif italic px-2 py-0.5 uppercase tracking-wider bg-destructive/10 rounded-sm">Satıldı</span>
                  )}
                </div>
                {isSold ? (
                  <span className="font-serif text-xl text-muted-foreground font-light opacity-60 line-through">
                    ₺{(product.price ?? 0).toLocaleString("tr-TR")}
                  </span>
                ) : (
                  <span className="font-serif text-2xl lg:text-3xl text-[#7b4019] font-semibold tracking-tight">
                    ₺{(product.price ?? 0).toLocaleString("tr-TR")}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mt-5 font-serif text-3xl sm:text-4xl font-normal leading-[1.15] text-foreground tracking-tight">
                {product.title}
              </h1>

              {/* Description */}
              {product.description && (
                <div className="mt-4 text-[#5c4a3d] font-serif text-sm sm:text-base leading-relaxed font-light italic border-b border-border/30 pb-4.5">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Core Specifications with dotted leaders */}
              {(era || material || dimensions || condition) && (
                <div className="space-y-3.5 mt-4">
                  {era && (
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Dönem</span>
                      <div className="grow mx-2 border-b border-dotted border-border/80" />
                      <span className="font-medium text-foreground">{eraLabels[era] || era}</span>
                    </div>
                  )}
                  {material && (
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Malzeme</span>
                      <div className="grow mx-2 border-b border-dotted border-border/80" />
                      <span className="font-medium text-foreground">{material}</span>
                    </div>
                  )}
                  {dimensions && (
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Ölçüler</span>
                      <div className="grow mx-2 border-b border-dotted border-border/80" />
                      <span className="font-medium text-foreground">{dimensions}</span>
                    </div>
                  )}
                  {condition && (
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Kondisyon</span>
                      <div className="grow mx-2 border-b border-dotted border-border/80" />
                      <span className="font-medium text-foreground">{condition}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Vignette divider ornament */}
              {(provenance || conditionDetails) && (era || material || dimensions || condition) && (
                <div className="my-4.5 flex items-center justify-center gap-2">
                  <div className="h-[0.5px] flex-1 bg-gradient-to-r from-transparent to-accent/30" />
                  <span className="text-[10px] text-accent/60 font-serif">❦</span>
                  <div className="h-[0.5px] flex-1 bg-gradient-to-l from-transparent to-accent/30" />
                </div>
              )}

              {/* Narrative fields */}
              {(provenance || conditionDetails) && (
                <div className="space-y-4">
                  {provenance && (
                    <div className="text-center px-1">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8c7355] block mb-1">
                        Hikaye ve Köken
                      </span>
                      <p className="font-serif text-xs sm:text-[13px] leading-relaxed text-foreground/80 italic">
                        "{provenance}"
                      </p>
                    </div>
                  )}
                  
                  {conditionDetails && (
                    <div className="text-center px-1">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8c7355] block mb-1">
                        Restorasyon / Onarım
                      </span>
                      <p className="font-serif text-xs sm:text-[13px] leading-relaxed text-foreground/80 italic">
                        "{conditionDetails}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Purchase & CTA Block */}
              <div className="mt-6 border-t border-border/30 pt-5 space-y-4">
                {!isSold && (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      {maxStock > 1 ? (
                        <div className="flex items-center gap-3">
                          <QuantitySelector max={maxStock} value={quantity} onChange={setQuantity} disabled={addingToCart || addedToCart} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500/80" />
                          <span>Tek Eser</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                        <div className={`h-1.5 w-1.5 rounded-full ${maxStock > 5 ? "bg-emerald-500/80" : maxStock > 0 ? "bg-amber-500/80" : "bg-red-500/80"}`} />
                        <span>
                          {maxStock === 1
                            ? "Sadece 1 adet mevcut"
                            : maxStock > 5
                              ? "Stokta mevcut"
                              : `Sadece ${maxStock} adet`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="h-12 w-full sm:flex-1 rounded-none bg-[#4a3424] px-6 text-[#fffaf0] font-sans tracking-widest hover:bg-[#362519] transition-all uppercase text-xs font-semibold border border-[#4a3424]"
                        onClick={handleAddToCart}
                        disabled={addingToCart || addedToCart}
                      >
                        {addedToCart ? <Check className="h-4 w-4 mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                        {addingToCart ? "Ekleniyor..." : addedToCart ? "Sepete Eklendi" : "Sepete Ekle"}
                      </Button>
                      <WhatsAppButton product={product} className="h-12 w-full sm:flex-1" />
                    </div>
                  </>
                )}

                {isSold && (
                  <div className="border border-destructive/10 bg-destructive/[0.01] p-4 text-center">
                    <p className="font-serif text-lg font-medium text-destructive">Tükendi</p>
                    <p className="mt-1 text-xs text-muted-foreground font-light leading-relaxed">
                      Bu eşsiz eser koleksiyonumuzdan ayrıldı. Benzer eserler için galerimizi keşfedebilir veya favorilerinize ekleyebilirsiniz.
                    </p>
                  </div>
                )}
              </div>

              {/* Secondary Actions */}
              <div className="mt-5 flex gap-6 justify-start border-t border-border/30 pt-4.5">
                <button
                  className="group flex items-center gap-2 text-xs tracking-widest uppercase font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleAddToWishlist}
                  disabled={addingToWishlist}
                >
                  <Heart className={`h-4 w-4 transition-transform group-hover:scale-110 ${addedToWishlist ? "fill-red-500 text-red-500" : ""}`} />
                  {addingToWishlist ? "İşlem yapılıyor..." : addedToWishlist ? "Favorilerde" : "Favorilere Ekle"}
                </button>
                <button className="group flex items-center gap-2 text-xs tracking-widest uppercase font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={handleShare}>
                  <Share2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Paylaş
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* General Info & Reviews Section */}
        <div className="mt-10 sm:mt-20 pt-6 sm:pt-10 border-t border-border/40 grid gap-10 lg:grid-cols-[1fr_2fr] items-start">
          <div className="space-y-6 w-full max-w-[600px] lg:max-w-none mx-auto">
            <h2 className="font-serif text-2xl text-foreground">Genel Bilgiler</h2>
            <div className="bg-card/30 border-2 border-primary/10 outline outline-1 outline-offset-[-6px] outline-accent/25 p-5 relative rounded-lg font-serif">
              {/* Specifications with dotted leaders */}
              <div className="space-y-3.5 mt-2">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Envanter No</span>
                  <div className="grow mx-2 border-b border-dotted border-border/80" />
                  <span className="font-medium text-foreground">CAN-{product.id.toString().padStart(4, "0")}</span>
                </div>
                {product.category && (
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Kategori</span>
                    <div className="grow mx-2 border-b border-dotted border-border/80" />
                    <span className="font-medium text-foreground">{product.category.name}</span>
                  </div>
                )}
                {era && (
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Dönem</span>
                    <div className="grow mx-2 border-b border-dotted border-border/80" />
                    <span className="font-medium text-foreground">{eraLabels[era] || era}</span>
                  </div>
                )}
                {material && (
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Malzeme</span>
                    <div className="grow mx-2 border-b border-dotted border-border/80" />
                    <span className="font-medium text-foreground">{material}</span>
                  </div>
                )}
                {dimensions && (
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Ölçüler</span>
                    <div className="grow mx-2 border-b border-dotted border-border/80" />
                    <span className="font-medium text-foreground">{dimensions}</span>
                  </div>
                )}
                {condition && (
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">Kondisyon</span>
                    <div className="grow mx-2 border-b border-dotted border-border/80" />
                    <span className="font-medium text-foreground">{condition}</span>
                  </div>
                )}
                {otherAttributes.map(({ key, value }) => (
                  <div key={key} className="flex items-baseline justify-between text-sm">
                    <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8c7355]">{getAttributeLabel(key)}</span>
                    <div className="grow mx-2 border-b border-dotted border-border/80" />
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full max-w-[800px] lg:max-w-none mx-auto">
            <h2 className="font-serif text-2xl mb-6 text-foreground">Yorumlar</h2>
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </section>
      <RelatedProducts products={relatedProducts} currentProductId={product.id} />
    </main>
  )
}
