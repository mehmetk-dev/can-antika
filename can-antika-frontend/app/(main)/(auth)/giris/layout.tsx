import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Giriş Yap",
    description: "Can Antika hesabınıza giriş yapın.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
