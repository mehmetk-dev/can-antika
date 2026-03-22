"use client"

import type React from "react"

import Image from "next/image"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    newsletter: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor")
      return
    }
    setIsSubmitting(true)
    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
      })
      toast.success("Kayıt başarılı! Giriş yapabilirsiniz.")
      router.push("/giris")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kayıt başarısız")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/antique-dealer-examining-vintage-clock-with-magnif.jpg"
          alt="Antika değerlendirme"
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <Link href="/" className="absolute top-8 left-8">
            <span className="font-serif text-3xl font-semibold text-primary-foreground">Can Antika</span>
          </Link>
          <blockquote className="max-w-md">
            <p className="font-serif text-2xl font-medium text-primary-foreground leading-relaxed">
              “Her antika, zamanda yolculuk yapmanıza izin veren bir penceredir.”
            </p>
            <footer className="mt-4 text-primary-foreground/70">— Koleksiyoner, Mehmet Kaya</footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-12 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="lg:hidden inline-block mb-8">
            <span className="font-serif text-2xl font-semibold text-primary">Can Antika</span>
          </Link>

          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Hesap Oluşturun</h1>
          <p className="mt-2 text-muted-foreground">Koleksiyonunuzu oluşturmaya başlayın</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad</Label>
                <Input
                  id="firstName"
                  placeholder="Adınız"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad</Label>
                <Input
                  id="lastName"
                  placeholder="Soyadınız"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  className="bg-muted/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, acceptTerms: checked as boolean }))}
                  required
                  className="border-border data-[state=checked]:bg-primary mt-0.5"
                />
                <Label htmlFor="acceptTerms" className="text-sm cursor-pointer leading-relaxed">
                  <Link href="/kullanim-kosullari" className="text-primary hover:underline">
                    Kullanım koşullarını
                  </Link>{" "}
                  ve{" "}
                  <Link href="/gizlilik" className="text-primary hover:underline">
                    gizlilik politikasını
                  </Link>{" "}
                  kabul ediyorum
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="newsletter"
                  checked={formData.newsletter}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, newsletter: checked as boolean }))}
                  className="border-border data-[state=checked]:bg-primary"
                />
                <Label htmlFor="newsletter" className="text-sm cursor-pointer">
                  Yeni ürünler ve fırsatlar hakkında bilgi almak istiyorum
                </Label>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Kayıt yapılıyor...</>
              ) : (
                "Kayıt Ol"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">veya</span>
            </div>
          </div>

          {/* Google Sign-up */}
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
            Google ile Kayıt Ol
          </a>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <Link href="/giris" className="font-medium text-primary hover:text-primary/80">
              Giriş Yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
