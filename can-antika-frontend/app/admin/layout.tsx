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
      <div className="min-h-screen bg-muted/30">
        <AdminSidebar className="hidden lg:flex" />
        <div className="lg:pl-64">
          <AdminHeader />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
