"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"

type FormMode = "login" | "register"

/** Only allow absolute site-internal paths (single leading slash, no protocol tricks) */
function getSafeRedirect(raw: string | null): string {
  if (!raw) return "/hesap"
  try {
    const decoded = decodeURIComponent(raw)
    if (decoded !== raw) return "/hesap" // reject encoded redirects
  } catch {
    return "/hesap"
  }
  if (!/^\/[a-zA-Z0-9\-_/]+$/.test(raw)) return "/hesap"
  return raw
}

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = getSafeRedirect(searchParams.get("redirect"))
  const { isAuthenticated, isLoading } = useAuth()
  const [mode, setMode] = useState<FormMode>("login")
  const [isAnimating, setIsAnimating] = useState(false)
  const [prefillEmail, setPrefillEmail] = useState("")

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isLoading, isAuthenticated, router, redirectTo])

  const switchMode = (newMode: FormMode) => {
    if (isAnimating) return
    setIsAnimating(true)
    setMode(newMode)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const handleLoginSuccess = () => router.replace(redirectTo)

  const handleSwitchToLogin = (email?: string) => {
    if (email) setPrefillEmail(email)
    switchMode("login")
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side – Decorative */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <Image
            src="/elegant-antique-shop-interior-with-chandeliers-and.jpg"
            alt="Antika mağaza"
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-primary/90" />
          <div className="absolute inset-8 border border-accent/30 rounded-lg" />
          <div className="absolute inset-12 border border-accent/20 rounded-lg" />

          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-accent/50 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <span className="font-serif text-3xl font-semibold text-primary-foreground">Can Antika</span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-px bg-accent/50 mx-auto mb-8" />
                <p
                  className="font-serif text-3xl font-medium text-primary-foreground leading-relaxed italic transition-all duration-500"
                  key={mode}
                  style={{ animation: "fadeSlideUp 0.5s ease-out" }}
                >
                  {mode === "login"
                    ? '"Her antika parça, geçmişten gelen bir mektuptur"'
                    : '"Koleksiyonumuza katılın, geçmişin zarafetini keşfedin"'}
                </p>
                <div className="w-20 h-px bg-accent/50 mx-auto mt-8" />
              </div>
            </div>

            <div className="flex items-center justify-between text-primary-foreground/60 text-sm">
              <span>Est. 1990</span>
              <span>Beyoğlu, İstanbul</span>
            </div>
          </div>
        </div>

        {/* Right Side – Forms */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-16 xl:px-24 bg-gradient-to-b from-background to-muted/20 overflow-y-auto">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="font-serif text-2xl font-semibold text-primary">Can Antika</span>
            </div>

            {/* Login */}
            <div className="relative">
              <div
                className={`transition-all duration-500 ease-in-out ${mode === "login"
                  ? "opacity-100 translate-x-0 pointer-events-auto"
                  : "opacity-0 -translate-x-8 pointer-events-none absolute inset-0"
                  }`}
              >
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onSwitchToRegister={() => switchMode("register")}
                  prefillEmail={prefillEmail}
                />
              </div>

              {/* Register */}
              <div
                className={`transition-all duration-500 ease-in-out ${mode === "register"
                  ? "opacity-100 translate-x-0 pointer-events-auto"
                  : "opacity-0 translate-x-8 pointer-events-none absolute inset-0"
                  }`}
              >
                <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
