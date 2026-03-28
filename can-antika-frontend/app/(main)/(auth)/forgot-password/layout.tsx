import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Şifremi Unuttum",
    description: "Can Antika hesabınızın şifresini sıfırlayın.",
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
