import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Admin Girişi",
    description: "Can Antika yönetim paneline giriş yapın.",
    robots: { index: false, follow: false },
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
