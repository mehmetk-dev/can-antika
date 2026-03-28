import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    VintageHeart, VintageBasket, VintageUser,
    VintageLogout, VintageShield,
} from "@/components/ui/vintage-icons"
import { NotificationsDropdown } from "@/components/header/notifications-dropdown"

interface HeaderActionsProps {
    isAuthenticated: boolean
    isAdmin: boolean
    userName?: string
    cartCount: number
    wishlistCount: number
    onLogout: () => void
}

export function HeaderActions({
    isAuthenticated,
    isAdmin,
    userName,
    cartCount,
    wishlistCount,
    onLogout,
}: HeaderActionsProps) {
    // Sepet butonu — her zaman görünür (mobil dahil)
    const cartButton = (
        <Link href="/sepet" prefetch={false}>
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
    )

    if (isAuthenticated && isAdmin) {
        return (
            <>
                <Link href="/admin" prefetch={false} className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="gap-2 text-foreground hover:text-primary transition-colors font-medium">
                        <VintageShield className="h-4 w-4" />
                        Admin Paneli
                    </Button>
                </Link>
                {cartButton}
                <Button variant="ghost" size="icon" onClick={onLogout} className="hidden sm:flex text-foreground hover:text-destructive transition-colors">
                    <VintageLogout className="h-5 w-5" />
                    <span className="sr-only">Çıkış</span>
                </Button>
            </>
        )
    }

    if (isAuthenticated) {
        return (
            <>
                <NotificationsDropdown />
                <Link href="/hesap/favoriler" prefetch={false} className="hidden sm:block">
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
                {cartButton}
                <Link href="/hesap" prefetch={false} className="hidden sm:block">
                    <Button variant="ghost" size="icon" className="text-foreground hover:text-primary transition-colors">
                        <VintageUser className="h-5 w-5" />
                        <span className="sr-only">{userName || "Hesap"}</span>
                    </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={onLogout} className="hidden sm:flex text-foreground hover:text-destructive transition-colors">
                    <VintageLogout className="h-5 w-5" />
                    <span className="sr-only">Çıkış</span>
                </Button>
            </>
        )
    }

    return (
        <>
            {cartButton}
            <Link href="/giris" prefetch={false} className="hidden sm:block">
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary transition-colors">
                    <VintageUser className="h-5 w-5" />
                    <span className="sr-only">Giriş Yap</span>
                </Button>
            </Link>
        </>
    )
}
