"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Shield, Store } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth/auth-context"

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isAdmin, isLoading } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated && isAdmin) {
      router.replace("/admin")
    }
  }, [isAuthenticated, isAdmin, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const userData = await login({ email: formData.email, password: formData.password })

      if (userData?.role !== "ADMIN") {
        toast.error("Bu hesap yönetici yetkisine sahip değil.", { id: "admin-login-error" })
        return
      }

      toast.success("Admin paneline hoş geldiniz.", { id: "admin-login-success" })
      router.push("/admin")
    } catch {
      toast.error("Giriş bilgileri hatalı.", { id: "admin-login-error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f17]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0f17]">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-900/10 blur-[120px]" />
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-indigo-900/10 blur-[100px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/20 to-amber-700/20 backdrop-blur-sm">
            <Shield className="h-8 w-8 text-amber-500" />
          </div>
          <div className="mb-2 flex items-center justify-center gap-2">
            <Store className="h-5 w-5 text-amber-500/70" />
            <span className="font-serif text-2xl font-semibold text-white">Can Antika</span>
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500">Yönetim Paneli</p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-semibold text-white">Admin Girişi</h1>
            <p className="mt-2 text-sm text-zinc-400">Yönetim paneline erişmek için admin bilgilerinizle giriş yapın.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium text-zinc-300">
                E-posta Adresi
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@canantika.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
                autoFocus
                className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-zinc-600 transition-colors focus:border-amber-500/50 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium text-zinc-300">
                Şifre
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  className="h-12 border-white/[0.08] bg-white/[0.04] pr-12 text-white placeholder:text-zinc-600 transition-colors focus:border-amber-500/50 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full border-0 bg-gradient-to-r from-amber-600 to-amber-700 text-base font-medium text-white shadow-lg shadow-amber-900/30 transition-all duration-200 hover:from-amber-500 hover:to-amber-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Doğrulanıyor...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" /> Panele Giriş Yap
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600">Bu sayfa sadece yetkili yöneticiler içindir.</p>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-zinc-700">
            <Lock className="h-3 w-3" />
            <span>256-bit SSL ile korunmaktadır</span>
          </div>
        </div>
      </div>
    </div>
  )
}
