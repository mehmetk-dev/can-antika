"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Heart, Package, MapPin, User, LogOut, ChevronLeft, MessageSquare, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"

const navigation = [
  { name: "Hesabım", href: "/hesap", icon: User },
  { name: "Favorilerim", href: "/hesap/favoriler", icon: Heart },
  { name: "Siparişlerim", href: "/hesap/siparisler", icon: Package },
  { name: "Adreslerim", href: "/hesap/adresler", icon: MapPin },
  { name: "Destek", href: "/hesap/destek", icon: MessageSquare },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, isAdmin } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <>
      {/* Mobile: horizontal tab bar */}
      <div className="lg:hidden -mx-4 sm:-mx-6 border-b border-border bg-background sticky top-[64px] z-20">
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="shrink-0 gap-2 rounded-full text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Çıkış
          </Button>
        </div>
      </div>

      {/* Desktop: vertical sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Mağazaya Dön
          </Link>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-border space-y-1">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Shield className="h-5 w-5" />
                Admin Panel
              </Link>
            )}
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
              <LogOut className="h-5 w-5" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
