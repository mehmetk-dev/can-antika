"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Heart, Share2, Shield, Truck, RotateCcw, Phone, ShoppingBag, Loader2, Check, Minus, Plus } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ImageGallery } from "@/components/product/image-gallery"
import { PurchaseDialog, ContactDialog } from "@/components/product/product-dialogs"
import { ProductReviews } from "@/components/product/product-reviews"
import { RelatedProducts } from "@/components/product/related-products"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { cartApi, wishlistApi } from "@/lib/api"
import type { ProductResponse } from "@/lib/types"

interface ProductDetailProps {
  product: ProductResponse
  relatedProducts?: ProductResponse[]
}

export function ProductDetail({ product, relatedProducts = [] }: ProductDetailProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [addingToWishlist, setAddingToWishlist] = useState(false)
  const [addedToWishlist, setAddedToWishlist] = useState(false)

  const maxStock = product.stock ?? 1

  useEffect(() => {
    if (isAuthenticated) {
      cartApi.getCart().then(cart => {
        const item = cart.items?.find(i => i.product.id === product.id)
        if (item && item.quantity >= maxStock) {
          setAddedToCart(true)
        }
      }).catch((e) => console.error("Sepet kontrol hatası:", e))
    }
  }, [isAuthenticated, product.id, maxStock])

  // Extract attributes
  const era = (product.attributes?.era as string) || ""
  const condition = (product.attributes?.condition as string) || ""
  const dimensions = (product.attributes?.dimensions as string) || ""
  const provenance = (product.attributes?.provenance as string) || ""
  const status = (product.attributes?.status as string) || "active"
  const outOfStock = maxStock <= 0

  const eraLabels: Record<string, string> = {
    "19th-century": "19. Yüzyıl",
    ottoman: "Osmanlı",
    victorian: "Viktoryen",
    "art-deco": "Art Deco",
  }

  const productImages = product.imageUrls?.length ? product.imageUrls : ["/placeholder.svg"]

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Sepete eklemek için giriş yapmalısınız")
      router.push("/giris")
      return
    }
    if (addedToCart) {
      toast.info("Bu ürün zaten sepetinizde")
      return
    }
    if (quantity < 1 || quantity > maxStock) {
      toast.error(`Lütfen 1 ile ${maxStock} arasında bir miktar seçin`)
      return
    }
    setAddingToCart(true)
    try {
      await cartApi.addItem({ productId: product.id, quantity })
      toast.success(`${quantity} adet ürün sepete eklendi`)
      setAddedToCart(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sepete eklenirken hata oluştu")
    } finally {
      setAddingToCart(false)
    }
  }

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Favorilere eklemek için giriş yapmalısınız")
      router.push("/giris")
      return
    }
    if (addedToWishlist) {
      toast.info("Bu ürün zaten favorilerinizde")
      return
    }
    setAddingToWishlist(true)
    try {
      await wishlistApi.addItem(product.id)
      toast.success("Ürün favorilere eklendi")
      setAddedToWishlist(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Favorilere eklenirken hata oluştu")
    } finally {
      setAddingToWishlist(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = product.title
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Bağlantı kopyalandı")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Breadcrumb */}
        <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
            </li>
            <ChevronRight className="h-4 w-4" />
            <li>
              <Link href="/urunler" className="hover:text-primary transition-colors">Ürünler</Link>
            </li>
            <ChevronRight className="h-4 w-4" />
            <li className="text-foreground font-medium truncate max-w-[200px]">{product.title}</li>
          </ol>
        </nav>

        {/* Product Section */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Image Gallery */}
            <ImageGallery images={productImages} productName={product.title} />

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Status Badge */}
              <div className="mb-4">
                {status !== "sold" ? (
                  <Badge className="bg-primary text-primary-foreground">Tek Ürün</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-muted-foreground text-muted">Satıldı</Badge>
                )}
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

              {/* Category */}
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

              {/* Description */}
              {product.description && (
                <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>
              )}

              {/* Quick Details */}
              <div className="mt-6 grid grid-cols-2 gap-4">
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
                  {/* Stock Display */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`h-2 w-2 rounded-full ${maxStock > 5 ? "bg-emerald-500" : maxStock > 0 ? "bg-amber-500" : "bg-red-500"}`} />
                    <span className="text-muted-foreground">
                      {maxStock > 5 ? "Stokta" : `Son ${maxStock} ürün`}
                    </span>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-foreground" htmlFor="quantity-selector">Adet:</label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={quantity <= 1 || addedToCart}
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        aria-label="Azalt"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <input
                        id="quantity-selector"
                        type="number"
                        min={1}
                        max={maxStock}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val)) {
                            setQuantity(Math.max(1, Math.min(maxStock, val)))
                          }
                        }}
                        disabled={addedToCart}
                        className="w-14 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        aria-label="Miktar"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={quantity >= maxStock || addedToCart}
                        onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                        aria-label="Arttır"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              {status !== "sold" && !outOfStock && (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="flex-1 h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm font-medium"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    {addedToCart ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                    {addingToCart ? "Ekleniyor..." : addedToCart ? "Sepete Eklendi" : `Sepete Ekle (${quantity} adet)`}
                  </Button>

                  <PurchaseDialog product={product} />
                  <ContactDialog product={product} />

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/905076879215?text=${encodeURIComponent(
                      `Merhaba, "${product.title}" (Envanter: CAN-${product.id.toString().padStart(4, "0")}, Fiyat: ₺${(product.price ?? 0).toLocaleString("tr-TR")}) hakkında bilgi almak istiyorum.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 h-12 items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1da851]"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp ile Bilgi Al
                  </a>
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

              {/* Trust Badges */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Uzman Onaylı</p>
                    <p className="text-xs text-muted-foreground">Sertifikalı</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Güvenli Kargo</p>
                    <p className="text-xs text-muted-foreground">Sigortalı</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <RotateCcw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">14 Gün İade</p>
                    <p className="text-xs text-muted-foreground">Koşulsuz</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Tabs */}
          <div className="mt-16">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto">
                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-serif">
                  Detaylar
                </TabsTrigger>
                <TabsTrigger value="provenance" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-serif">
                  Hikaye & Köken
                </TabsTrigger>
                {condition && (
                  <TabsTrigger value="condition" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-serif">
                    Durum Raporu
                  </TabsTrigger>
                )}
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-serif">
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
      </main>
      <RelatedProducts products={relatedProducts} currentProductId={product.id} />
      <Footer />
    </div>
  )
}
