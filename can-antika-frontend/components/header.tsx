"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  VintageSearch, VintageHeart, VintageBasket, VintageUser,
  VintageLogout, VintagePhone, VintageShield, VintageMenuIcon, VintageCorner
} from "@/components/ui/vintage-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { cartApi, productApi, categoryApi, wishlistApi } from "@/lib/api"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import type { ProductResponse, CategoryResponse } from "@/lib/types"

const navigation = [
  { name: "Ürünler", href: "/urunler", description: "Koleksiyonumuzu keşfedin" },
  { name: "Blog", href: "/blog", description: "Antika dünyasından yazılar" },
  { name: "Hakkımızda", href: "/hakkimizda", description: "35 yıllık tecrübe" },
  { name: "SSS", href: "/sss", description: "Sık sorulan sorular" },
]

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ProductResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchCounts = () => {
      cartApi.getCart().then((cart) => setCartCount(cart.items?.length ?? 0)).catch((e) => console.error("Sepet sayısı alınamadı:", e))
      wishlistApi.getWishlist().then((list) => setWishlistCount(list.items?.length ?? 0)).catch((e) => console.error("İstek listesi sayısı alınamadı:", e))
    }

    fetchCounts()

    window.addEventListener("cart-updated", fetchCounts)
    window.addEventListener("wishlist-updated", fetchCounts)

    return () => {
      window.removeEventListener("cart-updated", fetchCounts)
      window.removeEventListener("wishlist-updated", fetchCounts)
    }
  }, [isAuthenticated])

  // Debounced autocomplete search
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return }
    const timer = setTimeout(() => {
      productApi.search({ title: searchQuery.trim(), page: 0, size: 5 })
        .then((res) => setSearchResults(res.items || []))
        .catch(() => setSearchResults([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch categories on mount
  useEffect(() => {
    categoryApi.getAll()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/urunler?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery("")
      setSearchResults([])
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/5">
                <VintageMenuIcon className="h-6 w-6" />
                <span className="sr-only">Menüyü aç</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-80 border-r-2 border-primary/20 bg-[#fdf8f1] p-0 z-50 shadow-[10px_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-0"
            >
              <SheetTitle className="sr-only">Navigasyon Menüsü</SheetTitle>
              <SheetDescription className="sr-only">Site içindeki sayfalara ve kategorilere ulaşmak için navigasyon menüsü.</SheetDescription>
              {/* Vintage paper texture overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03] z-0"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                }}
              />

              {/* Decorative corners */}
              <VintageCorner className="absolute top-4 left-4 h-10 w-10 text-primary/30 z-[1]" />
              <VintageCorner className="absolute top-4 right-4 h-10 w-10 text-primary/30 -scale-x-100 z-[1]" />
              <VintageCorner className="absolute bottom-4 left-4 h-10 w-10 text-primary/30 -scale-y-100 z-[1]" />
              <VintageCorner className="absolute bottom-4 right-4 h-10 w-10 text-primary/30 scale-x-[-1] scale-y-[-1] z-[1]" />

              {/* Header with logo */}
              <div className="relative shrink-0 border-b border-primary/10 px-6 py-8 z-[2]">
                <div className="text-center">
                  <span className="font-serif text-2xl font-semibold tracking-tight text-primary">Can Antika</span>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Est. 1990</span>
                    <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="relative flex-1 overflow-y-auto px-6 py-8 z-[2]">
                <div className="space-y-2">
                  {navigation.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="group relative block rounded-lg border border-transparent px-4 py-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5"
                    >
                      {/* Decorative number */}
                      <span className="absolute -left-2 top-1/2 -translate-y-1/2 font-serif text-3xl font-light text-primary/10 transition-colors group-hover:text-primary/20">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="ml-6">
                        <span className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">
                          {item.name}
                        </span>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                      </div>

                      {/* Hover arrow */}
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/0 transition-all duration-300 group-hover:text-primary/60 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  ))}



                  {isAuthenticated && (
                    <Link
                      href="/hesap/siparisler"
                      onClick={() => setIsMenuOpen(false)}
                      className="group relative block rounded-lg border border-transparent px-4 py-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5"
                    >
                      <span className="absolute -left-2 top-1/2 -translate-y-1/2 font-serif text-3xl font-light text-primary/10 transition-colors group-hover:text-primary/20">
                        04
                      </span>
                      <div className="ml-6">
                        <span className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">
                          Siparişlerim
                        </span>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Decorative divider */}
                <div className="my-8 flex items-center gap-3">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  <svg className="h-4 w-4 text-primary/30" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L9 9H2l6 4.5L5.5 22 12 17l6.5 5-2.5-8.5L22 9h-7L12 2z" />
                  </svg>
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                </div>

                {/* Account & Contact buttons */}
                <div className="space-y-3">
                  <Link
                    href="/hesap"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 transition-all hover:bg-primary/10"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30">
                      <VintageUser className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Hesabım</span>
                  </Link>

                  <Link
                    href="/iletisim"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 transition-all hover:bg-primary/10"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30">
                      <VintagePhone className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">İletişim</span>
                  </Link>
                </div>
              </nav>

              {/* Footer */}
              <div className="relative mt-auto shrink-0 border-t border-primary/10 bg-muted/20 px-6 py-4 z-[2]">
                <p className="text-center text-xs text-muted-foreground">
                  <span className="font-serif italic">"Geçmişin izinde, geleceğe miras"</span>
                </p>
                <p className="mt-1 text-center text-[10px] text-muted-foreground/60">Çukurcuma, Beyoğlu - İstanbul</p>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-semibold tracking-tight text-primary lg:text-3xl">
              Can Antika
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-8">


            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <div className="absolute inset-x-0 top-0 h-full flex items-center px-4 bg-background/95 backdrop-blur z-50 sm:static sm:inset-auto sm:h-auto sm:px-0 sm:bg-transparent sm:z-auto gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Input
                    type="search"
                    placeholder="Antika ara..."
                    className="w-full sm:w-64 bg-muted/50"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border bg-background shadow-lg overflow-hidden w-full">
                      {searchResults.map((p) => (
                        <Link
                          key={p.id}
                          href={`/urun/${p.slug ?? p.id}`}
                          onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]) }}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors"
                        >
                          <Image
                            src={p.imageUrls?.[0] || "/placeholder.svg"}
                            alt={p.title}
                            width={40}
                            height={40}
                            className="rounded object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                            <p className="text-xs text-primary font-semibold">₺{p.price.toLocaleString("tr-TR")}</p>
                          </div>
                        </Link>
                      ))}
                      <Link
                        href={`/urunler?q=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]) }}
                        className="block border-t px-3 py-2 text-center text-xs font-medium text-primary hover:bg-muted transition-colors"
                      >
                        Tüm sonuçları gör →
                      </Link>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]) }} className="text-foreground shrink-0">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Aramayı Kapat</span>
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="text-foreground hover:text-primary transition-colors">
                <VintageSearch className="h-7 w-7" />
                <span className="sr-only">Ara</span>
              </Button>
            )}
            {isAuthenticated && isAdmin ? (
              /* ── Admin kullanıcısı: Mağaza tarafında sadece Admin Paneli butonu ── */
              <>
                <Link href="/admin" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="gap-2 text-foreground hover:text-primary transition-colors font-medium">
                    <VintageShield className="h-4 w-4" />
                    Admin Paneli
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="hidden sm:flex text-foreground hover:text-destructive transition-colors">
                  <VintageLogout className="h-5 w-5" />
                  <span className="sr-only">Çıkış</span>
                </Button>
              </>
            ) : isAuthenticated ? (
              /* ── Normal müşteri: Sepet, Favoriler, Hesap ── */
              <>
                <NotificationsDropdown />
                <Link href="/hesap/favoriler" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary transition-colors">
                    <VintageHeart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {wishlistCount > 9 ? "9+" : wishlistCount}
                      </span>
                    )}
                    <span className="sr-only">Favoriler</span>
                  </Button>
                </Link>
                <Link href="/sepet" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary transition-colors">
                    <VintageBasket className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                    <span className="sr-only">Sepet</span>
                  </Button>
                </Link>
                <Link href="/hesap" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="text-foreground hover:text-primary transition-colors">
                    <VintageUser className="h-5 w-5" />
                    <span className="sr-only">{user?.name || "Hesap"}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="hidden sm:flex text-foreground hover:text-destructive transition-colors">
                  <VintageLogout className="h-5 w-5" />
                  <span className="sr-only">Çıkış</span>
                </Button>
              </>
            ) : (
              /* ── Giriş yapmamış ziyaretçi ── */
              <>
                <Link href="/iletisim" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="text-foreground hover:text-primary transition-colors">
                    <VintagePhone className="h-5 w-5" />
                    <span className="sr-only">İletişim</span>
                  </Button>
                </Link>
                <Link href="/giris" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="text-foreground hover:text-primary transition-colors">
                    <VintageUser className="h-5 w-5" />
                    <span className="sr-only">Giriş Yap</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
