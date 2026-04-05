"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useCartWishlistCounts } from "@/hooks/useCartWishlistCounts"
import { MobileMenu } from "@/components/header/mobile-menu"
import { HeaderSearch } from "@/components/header/header-search"
import { HeaderActions } from "@/components/header/header-actions"

interface HeaderClientIslandProps {
  navigation: { name: string; href: string; description: string }[]
}

export function HeaderClientIsland({ navigation }: HeaderClientIslandProps) {
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
    <>
      {/* Mobile menu — renders into the header via portal or absolute positioning */}
      <div className="absolute left-4 lg:hidden">
        <MobileMenu
          isOpen={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          navigation={navigation}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Actions: search + user/cart */}
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
    </>
  )
}
