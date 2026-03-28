import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Kayıt Ol",
    description: "Can Antika'ya üye olun, antika koleksiyonumuza göz atın.",
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
