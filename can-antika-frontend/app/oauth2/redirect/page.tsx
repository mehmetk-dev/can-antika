"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { authApi } from "@/lib/api"
import { clearAuthSessionFlag, markAuthSessionActive } from "@/lib/auth/auth-session"

function OAuth2RedirectContent() {
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("Google ile giriş yapılıyor...")

    useEffect(() => {
        // Cookie'ler backend tarafından zaten set edildi, sadece user bilgisini çek
        markAuthSessionActive()
        authApi.getProfile()
            .then((user) => {
                setStatus("success")
                setMessage(`Hoş geldiniz, ${user.name}!`)
                setTimeout(() => router.push("/hesap"), 1500)
            })
            .catch(() => {
                clearAuthSessionFlag()
                setStatus("error")
                setMessage("Giriş doğrulanamadı. Lütfen tekrar deneyin.")
                setTimeout(() => router.push("/giris"), 3000)
            })
    }, [router])

    return (
        <div className="text-center space-y-6 p-8">
            {status === "loading" && (
                <>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                    <div>
                        <h2 className="font-serif text-2xl font-semibold text-foreground">Giriş Yapılıyor</h2>
                        <p className="mt-2 text-muted-foreground">{message}</p>
                    </div>
                </>
            )}

            {status === "success" && (
                <>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mx-auto">
                        <CheckCircle className="h-10 w-10 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="font-serif text-2xl font-semibold text-foreground">Giriş Başarılı!</h2>
                        <p className="mt-2 text-muted-foreground">{message}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Yönlendiriliyorsunuz...</p>
                    </div>
                </>
            )}

            {status === "error" && (
                <>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                        <XCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <div>
                        <h2 className="font-serif text-2xl font-semibold text-foreground">Giriş Başarısız</h2>
                        <p className="mt-2 text-muted-foreground">{message}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Giriş sayfasına yönlendiriliyorsunuz...</p>
                    </div>
                </>
            )}
        </div>
    )
}

export default function OAuth2RedirectPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Suspense fallback={
                <div className="text-center space-y-6 p-8">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                    <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
            }>
                <OAuth2RedirectContent />
            </Suspense>
        </div>
    )
}
