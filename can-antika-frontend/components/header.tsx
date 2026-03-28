"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCartWishlistCounts } from "@/hooks/useCartWishlistCounts"
import { MobileMenu } from "@/components/header/mobile-menu"
import { HeaderSearch } from "@/components/header/header-search"
import { HeaderActions } from "@/components/header/header-actions"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Ürünler", href: "/urunler", description: "Koleksiyonumuzu keşfedin" },
  { name: "Blog", href: "/blog", description: "Antika dünyasından yazılar" },
  { name: "Hakkımızda", href: "/hakkimizda", description: "35 yıllık tecrübe" },
  { name: "İletişim", href: "/iletisim", description: "Bize ulaşın" },
  { name: "SSS", href: "/sss", description: "Sık sorulan sorular" },
]

interface HeaderProps {
  sticky?: boolean
  className?: string
}

export function Header({ sticky = true, className }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const { cartCount, wishlistCount } = useCartWishlistCounts(isAuthenticated)
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header
      className={cn(
        "z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        sticky ? "sticky top-0" : "relative",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <MobileMenu
            isOpen={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            navigation={navigation}
            isAuthenticated={isAuthenticated}
          />

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
            <HeaderSearch isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />
            <HeaderActions
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              userName={user?.name}
              cartCount={cartCount}
              wishlistCount={wishlistCount}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
