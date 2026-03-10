"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Heart, Package, MapPin, User, LogOut, ChevronLeft, MessageSquare, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

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
    <aside className="w-full lg:w-64 shrink-0">
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
  )
}
