"use client"

import { Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AdminSidebar } from "./admin-sidebar"
import { NotificationsDropdown } from "@/components/header/notifications-dropdown"
import { useAuth } from "@/lib/auth/auth-context"

type AdminHeaderUser = {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  profileImageUrl?: string | null
  imageUrl?: string | null
  photoUrl?: string | null
  picture?: string | null
}

function getInitials(user?: AdminHeaderUser | null) {
  const source = user?.name?.trim() || user?.email?.trim() || "Admin"
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

function getAvatarUrl(user?: AdminHeaderUser | null) {
  return (
    user?.avatarUrl ||
    user?.profileImageUrl ||
    user?.imageUrl ||
    user?.photoUrl ||
    user?.picture ||
    ""
  )
}

export function AdminHeader() {
  const { user } = useAuth()
  const avatarUrl = getAvatarUrl(user)
  const initials = getInitials(user)

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menüyü Aç</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Ara..." className="pl-9 bg-muted/50" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <NotificationsDropdown />
        <Avatar className="h-9 w-9">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={user?.name || "Admin kullanici"} />
          ) : null}
          <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
