"use client"

import type React from "react"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Sparkles, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "@/components/header"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

type FormMode = "login" | "register"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get("redirect") || "/hesap"
  // Sadece site-içi yönlendirmelere izin ver (open redirect koruması)
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/hesap"
  const { login, register, isAuthenticated, isLoading } = useAuth()
  const [mode, setMode] = useState<FormMode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  // Register form state
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })

  // Zaten giriş yapmış kullanıcıyı yönlendir
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await login({ email: loginData.email, password: loginData.password })
      toast.success("Giriş başarılı!")
      router.replace(redirectTo)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Giriş başarısız")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor")
      return
    }
    if (!registerData.acceptTerms) {
      toast.error("Kullanım koşullarını kabul etmeniz gerekiyor")
      return
    }
    setIsSubmitting(true)
    try {
      await register({
        name: `${registerData.firstName} ${registerData.lastName}`,
        email: registerData.email,
        password: registerData.password,
      })
      toast.success("Kayıt başarılı!")
      switchMode("login")
      setLoginData(prev => ({ ...prev, email: registerData.email }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kayıt başarısız")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side - Decorative */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <Image
            src="/elegant-antique-shop-interior-with-chandeliers-and.jpg"
            alt="Antika mağaza"
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-primary/90" />

          {/* Decorative Frame */}
          <div className="absolute inset-8 border border-accent/30 rounded-lg" />
          <div className="absolute inset-12 border border-accent/20 rounded-lg" />

          {/* Content */}
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

        {/* Right Side - Forms */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-16 xl:px-24 bg-gradient-to-b from-background to-muted/20 overflow-y-auto">
          <div className="mx-auto w-full max-w-md" ref={formRef}>
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="font-serif text-2xl font-semibold text-primary">Can Antika</span>
            </div>

            {/* Animated Form Container */}
            <div className="relative">
              {/* ═══════ LOGIN FORM ═══════ */}
              <div
                className={`transition-all duration-500 ease-in-out ${mode === "login"
                  ? "opacity-100 translate-x-0 pointer-events-auto"
                  : "opacity-0 -translate-x-8 pointer-events-none absolute inset-0"
                  }`}
              >
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Üye Girişi
                  </div>
                  <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">Hoş Geldiniz</h1>
                  <p className="mt-3 text-muted-foreground text-lg">Hesabınıza giriş yaparak koleksiyonumuzu keşfedin</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-foreground font-medium">E-posta Adresi</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      className="h-12 bg-card border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-foreground font-medium">Şifre</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                        required
                        className="h-12 bg-card border-border/50 focus:border-primary transition-colors pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="rememberMe"
                      checked={loginData.rememberMe}
                      onCheckedChange={(checked) => setLoginData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="rememberMe" className="text-sm cursor-pointer text-muted-foreground">Beni hatırla</Label>
                  </div>
                  <div className="text-right -mt-1">
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Şifremi unuttum
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Giriş yapılıyor...</>
                    ) : (
                      "Giriş Yap"
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-sm text-muted-foreground">veya</span>
                  </div>
                </div>

                {/* Google Login */}
                <a
                  href="/oauth2/authorization/google"
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted/50 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google ile Giriş Yap
                </a>

                {/* Switch to Register */}
                <div className="text-center mt-6">
                  <p className="text-muted-foreground">
                    Henüz üye değil misiniz?{" "}
                    <button
                      onClick={() => switchMode("register")}
                      className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Kayıt Olun
                    </button>
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-border/30">
                  <p className="text-center text-sm text-muted-foreground">256-bit SSL şifreleme ile güvende</p>
                </div>
              </div>

              {/* ═══════ REGISTER FORM ═══════ */}
              <div
                className={`transition-all duration-500 ease-in-out ${mode === "register"
                  ? "opacity-100 translate-x-0 pointer-events-auto"
                  : "opacity-0 translate-x-8 pointer-events-none absolute inset-0"
                  }`}
              >
                <div className="mb-6">
                  <button
                    onClick={() => switchMode("login")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Giriş ekranına dön
                  </button>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Yeni Üyelik
                  </div>
                  <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">Kayıt Olun</h1>
                  <p className="mt-3 text-muted-foreground text-lg">Koleksiyonumuza katılın</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="reg-firstName" className="text-foreground font-medium">Ad</Label>
                      <Input
                        id="reg-firstName"
                        placeholder="Adınız"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, firstName: e.target.value }))}
                        required
                        className="h-11 bg-card border-border/50 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-lastName" className="text-foreground font-medium">Soyad</Label>
                      <Input
                        id="reg-lastName"
                        placeholder="Soyadınız"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, lastName: e.target.value }))}
                        required
                        className="h-11 bg-card border-border/50 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-foreground font-medium">E-posta Adresi</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      className="h-11 bg-card border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-foreground font-medium">Şifre</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="En az 6 karakter"
                        value={registerData.password}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                        required
                        minLength={6}
                        className="h-11 bg-card border-border/50 focus:border-primary transition-colors pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-confirmPassword" className="text-foreground font-medium">Şifre Tekrar</Label>
                    <Input
                      id="reg-confirmPassword"
                      type="password"
                      placeholder="Şifrenizi tekrar girin"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={6}
                      className="h-11 bg-card border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <Checkbox
                      id="acceptTerms"
                      checked={registerData.acceptTerms}
                      onCheckedChange={(checked) => setRegisterData((prev) => ({ ...prev, acceptTerms: checked as boolean }))}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5"
                    />
                    <Label htmlFor="acceptTerms" className="text-sm cursor-pointer text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">Kullanım koşullarını</span> ve{" "}
                      <span className="font-medium text-foreground">gizlilik politikasını</span> okudum, kabul ediyorum.
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !registerData.acceptTerms}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Kayıt yapılıyor...</>
                    ) : (
                      "Kayıt Ol"
                    )}
                  </Button>
                </form>

                {/* Switch to Login */}
                <div className="text-center mt-5">
                  <p className="text-muted-foreground">
                    Zaten üye misiniz?{" "}
                    <button
                      onClick={() => switchMode("login")}
                      className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Giriş Yapın
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
