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

function TrustInfoPanel({
  provenance,
  era,
  material,
  condition,
  conditionDetails,
  authenticityNote,
}: {
  provenance: string
  era: string
  material: string
  condition: string
  conditionDetails: string
  authenticityNote: string
}) {
  const rows = [
    { label: "Menşei / Köken", value: provenance || "Köken ve edinim bilgisi satış öncesinde talep halinde paylaşılır." },
    { label: "Tahmini Dönem", value: era ? (eraLabels[era] || era) : "Dönem bilgisi uzman değerlendirmesine göre paylaşılır." },
    { label: "Malzeme", value: material || "Malzeme bilgisi ürün incelemesiyle teyit edilir." },
    { label: "Kondisyon", value: condition || "Kondisyon bilgisi görseller ve satış öncesi değerlendirme üzerinden paylaşılır." },
    { label: "Restorasyon / Onarım", value: conditionDetails || "Belirtilmiş restorasyon veya onarım notu bulunmuyor." },
    {
      label: "Orijinallik ve Belge",
      value: authenticityNote || "Bu ürün Can Antika uzman değerlendirmesiyle satışa sunulmuştur. Ek belge ve değerlendirme talepleri için satış öncesinde bizimle iletişime geçebilirsiniz.",
    },
    { label: "Fatura ile Satış", value: "Evet, satış fatura ile yapılır." },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-lg border border-[#d4af37]/25 bg-[#fffaf0] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/35 bg-white text-[#7b4019]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-foreground">Güven ve Ürün Bilgileri</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Antika ve koleksiyon ürünlerinde açıklamalar; görsel inceleme, ürün kondisyonu ve uzman değerlendirmesi esas alınarak hazırlanır.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/50 bg-card">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 border-b border-border/40 px-4 py-3 last:border-b-0 sm:grid-cols-[170px_1fr] sm:gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">{row.label}</span>
            <span className="font-serif text-sm leading-relaxed text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductDetail({ product, relatedProducts = [] }: ProductDetailProps) {
  const [activeTab, setActiveTab] = useState("details")
  const handleTabChange = useCallback((tab: string) => {
    const scrollY = window.scrollY
    setActiveTab(tab)
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY })
    })
  }, [])

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
      <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
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
        <div className="grid gap-6 sm:gap-10 lg:grid-cols-[5fr_7fr] lg:gap-12 items-start">
          <div className="relative min-w-0 w-full">
            <ImageGallery images={productImages} productName={product.title} />
          </div>

          <div className="min-w-0 w-full flex flex-col pt-2 lg:pt-0">
            {/* Breadcrumb / Hierarchy */}
            <div className="mb-2 hidden md:flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Koleksiyon</span>
              {era && (
                <>
                  <span className="opacity-50">/</span>
                  <span>{eraLabels[era] || era}</span>
                </>
              )}
              {product.category && (
                <>
                  <span className="opacity-50">/</span>
                  <span>{product.category.name}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal leading-[1.1] tracking-tight text-foreground text-balance">
              {product.title}
            </h1>

            {/* Price and Status Grid */}
            <div className="mt-4 flex items-baseline gap-4">
              {isSold ? (
                <p className="font-sans text-3xl lg:text-4xl text-muted-foreground font-medium opacity-70 line-through">
                  ₺{(product.price ?? 0).toLocaleString("tr-TR")}
                </p>
              ) : (
                <p className="font-sans text-3xl lg:text-4xl text-foreground font-medium tracking-tight">
                  ₺{(product.price ?? 0).toLocaleString("tr-TR")}
                </p>
              )}

              {!isSold ? (
                maxStock === 1 ? (
                  <span className="text-[#6f4c1f] font-serif italic tracking-wide text-sm ml-auto pr-2">Tek Eser</span>
                ) : null
              ) : (
                <span className="text-destructive font-serif italic tracking-wide text-sm ml-auto pr-2">Satıldı</span>
              )}
            </div>

            {/* Quick Conditiion Inline */}
            {(condition || dimensions) && (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {condition && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#d4af37]">✧</span>
                    <span className="font-light">Kondisyon: <span>{condition}</span></span>
                  </div>
                )}
                {dimensions && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#d4af37]">⬚</span>
                    <span className="font-light">Ölçüler: {dimensions}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mt-4 mb-2 text-base lg:text-lg text-[#5c4a3d]/90 leading-relaxed font-light font-serif border-l-2 border-[#d4af37]/10 pl-6 py-2">
                <p>{product.description}</p>
              </div>
            )}

            {/* Stock Info & Quantity Selector */}
            {!isSold && (
              <div className="mt-8 flex items-center gap-6">
                {maxStock > 1 && (
                  <QuantitySelector max={maxStock} value={quantity} onChange={setQuantity} disabled={addingToCart || addedToCart} />
                )}
                <div className="flex items-center gap-2 text-sm">
                  <div className={`h-1.5 w-1.5 rounded-full ${maxStock > 5 ? "bg-emerald-500/80" : maxStock > 0 ? "bg-amber-500/80" : "bg-red-500/80"}`} />
                  <span className="text-muted-foreground font-light text-xs">
                    {maxStock === 1
                      ? "Sadece 1 adet mevcut"
                      : maxStock > 5
                        ? "Stokta mevcut"
                        : `Sadece ${maxStock} adet limitli`}
                  </span>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            {!isSold && (
              <div className="mt-10 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    className="h-14 w-full gap-2 rounded-none bg-[#4a3424] px-4 py-2 text-center text-white font-sans tracking-widest hover:bg-[#362519] transition-all uppercase text-sm"
                    onClick={handleAddToCart}
                    disabled={addingToCart || addedToCart}
                  >
                    {addedToCart ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                    {addingToCart ? "Ekleniyor..." : addedToCart ? "Sepete Eklendi" : "Sepete Ekle"}
                  </Button>
                </div>

                <div className="pt-2">
                  <WhatsAppButton product={product} className="" />
                </div>
              </div>
            )}

            {isSold && (
              <div className="mt-10 border-t border-destructive/20 py-8 text-center">
                <p className="font-serif text-2xl font-light text-destructive/80">Tükendi</p>
                <p className="mt-3 text-sm text-muted-foreground font-light">
                  Bu eşsiz eser koleksiyonumuzdan ayrıldı. Benzer eserler için galerimizi keşfedebilir veya favorilerinize ekleyebilirsiniz.
                </p>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="mt-4 sm:mt-8 flex flex-wrap gap-6 border-t border-border/20 pt-6 justify-center lg:justify-start">
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

        {/* Tabs Section (Desktop) / Accordion (Mobile) */}
        <div className="mt-10 sm:mt-20 pt-6 sm:pt-10 border-t border-border/40">

          {/* DESKTOP TABS */}
          <div className="hidden md:block">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-8 flex h-auto w-full justify-start gap-8 rounded-none border-b border-border/40 bg-transparent p-0">
                <TabsTrigger
                  value="details"
                  className="relative rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 font-serif text-sm tracking-wide text-muted-foreground transition-none data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Detaylar
                </TabsTrigger>
                <TabsTrigger
                  value="provenance"
                  className="relative rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 font-serif text-sm tracking-wide text-muted-foreground transition-none data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Köken ve Güven Bilgileri
                </TabsTrigger>

                <TabsTrigger
                  value="reviews"
                  className="relative rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 font-serif text-sm tracking-wide text-muted-foreground transition-none data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Yorumlar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-0 outline-none">
                <div className="grid gap-x-12 gap-y-2 sm:grid-cols-2">
                  {era && (
                    <div className="flex justify-between items-end border-b border-border/40 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Dönem</span>
                      <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right">{eraLabels[era] || era}</span>
                    </div>
                  )}
                  {product.category && (
                    <div className="flex justify-between items-end border-b border-border/40 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Kategori</span>
                      <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right">{product.category.name}</span>
                    </div>
                  )}
                  {dimensions && (
                    <div className="flex justify-between items-end border-b border-border/40 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Boyutlar</span>
                      <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right">{dimensions}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end border-b border-border/40 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Envanter No</span>
                    <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                    <span className="font-serif text-sm font-medium text-foreground text-right">CAN-{product.id.toString().padStart(4, "0")}</span>
                  </div>
                  {otherAttributes.map(({ key, value }) => (
                    <div key={key} className="flex justify-between items-end border-b border-border/40 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">
                        {getAttributeLabel(key)}
                      </span>
                      <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="provenance" className="mt-0 outline-none">
                <TrustInfoPanel
                  provenance={provenance}
                  era={era}
                  material={material}
                  condition={condition}
                  conditionDetails={conditionDetails}
                  authenticityNote={authenticityNote}
                />
              </TabsContent>



              <TabsContent value="reviews" className="mt-0 min-h-[360px] outline-none pt-4">
                {activeTab === "reviews" ? <ProductReviews productId={product.id} /> : null}
              </TabsContent>
            </Tabs>
          </div>

          {/* MOBILE ACCORDION */}
          <div className="md:hidden">
            <Accordion type="single" collapsible value={activeTab} onValueChange={handleTabChange} className="w-full">
              <AccordionItem value="details" className="border-border/40">
                <AccordionTrigger className="font-serif text-lg tracking-wide hover:no-underline">Detaylar</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-y-1">
                    {era && (
                      <div className="flex justify-between items-end border-b border-border/40 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Dönem</span>
                        <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                        <span className="font-serif text-sm font-medium text-foreground text-right">{eraLabels[era] || era}</span>
                      </div>
                    )}
                    {product.category && (
                      <div className="flex justify-between items-end border-b border-border/40 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Kategori</span>
                        <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                        <span className="font-serif text-sm font-medium text-foreground text-right">{product.category.name}</span>
                      </div>
                    )}
                    {dimensions && (
                      <div className="flex justify-between items-end border-b border-border/40 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Boyutlar</span>
                        <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                        <span className="font-serif text-sm font-medium text-foreground text-right">{dimensions}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end border-b border-border/40 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Envanter No</span>
                      <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right">CAN-{product.id.toString().padStart(4, "0")}</span>
                    </div>
                    {otherAttributes.map(({ key, value }) => (
                      <div key={key} className="flex justify-between items-end border-b border-border/40 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">
                          {getAttributeLabel(key)}
                        </span>
                        <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                        <span className="font-serif text-sm font-medium text-foreground text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="provenance" className="border-border/40">
                <AccordionTrigger className="font-serif text-lg tracking-wide hover:no-underline">Köken ve Güven Bilgileri</AccordionTrigger>
                <AccordionContent>
                  <TrustInfoPanel
                    provenance={provenance}
                    era={era}
                    material={material}
                    condition={condition}
                    conditionDetails={conditionDetails}
                    authenticityNote={authenticityNote}
                  />
                </AccordionContent>
              </AccordionItem>



              <AccordionItem value="reviews" className="border-border/40 border-b-0">
                <AccordionTrigger className="font-serif text-lg tracking-wide hover:no-underline">Yorumlar</AccordionTrigger>
                <AccordionContent className="min-h-[320px]">
                  {activeTab === "reviews" ? <ProductReviews productId={product.id} /> : null}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      <RelatedProducts products={relatedProducts} currentProductId={product.id} />
    </main>
  )
}
