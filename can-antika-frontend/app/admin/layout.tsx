"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Admin login page - no sidebar, no header, no auth guard
  if (pathname === "/admin/giris") {
    return <>{children}</>
  }

  return (
    <AuthGuard adminOnly>
      <div
        className="min-h-screen"
        style={{
          colorScheme: "light",
          // Force light mode CSS variables
          // @ts-ignore - CSS custom props
          "--background": "oklch(0.97 0.01 90)",
          "--foreground": "oklch(0.25 0.02 150)",
          "--card": "oklch(0.98 0.008 85)",
          "--card-foreground": "oklch(0.25 0.02 150)",
          "--popover": "oklch(0.98 0.008 85)",
          "--popover-foreground": "oklch(0.25 0.02 150)",
          "--muted": "oklch(0.92 0.01 145)",
          "--muted-foreground": "oklch(0.45 0.04 145)",
          "--border": "oklch(0.88 0.02 145)",
          "--input": "oklch(0.92 0.01 145)",
          backgroundColor: "#f8f6f1",
        } as React.CSSProperties}
      >
        <AdminSidebar className="hidden lg:flex" />
        <div className="lg:pl-64">
          <AdminHeader />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
