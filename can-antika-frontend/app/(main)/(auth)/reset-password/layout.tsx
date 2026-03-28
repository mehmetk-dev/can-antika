import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Şifre Sıfırlama",
    description: "Can Antika hesabınız için yeni şifre belirleyin.",
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
