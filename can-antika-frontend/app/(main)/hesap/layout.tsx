"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <div className="bg-background">
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                        <DashboardSidebar />
                        <div className="flex-1">{children}</div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    )
}
