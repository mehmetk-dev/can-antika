"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Shield, Lock, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function AdminLoginPage() {
    const router = useRouter()
    const { login, isAuthenticated, isAdmin, isLoading } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    // If already authenticated as admin, redirect to admin dashboard
    useEffect(() => {
        if (isLoading) return
        if (isAuthenticated && isAdmin) {
            router.replace("/admin")
        }
    }, [isAuthenticated, isAdmin, isLoading, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await login({ email: formData.email, password: formData.password })
                .then((userData) => {
                    if (userData?.role !== "ADMIN") {
                        toast.error("Bu hesap yönetici yetkisine sahip değil")
                        return
                    }
                    toast.success("Admin paneline hoş geldiniz!")
                    router.push("/admin")
                })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Giriş başarısız")
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
            {/* Animated background */}
            <div className="absolute inset-0">
                {/* Radial gradient glow */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-900/10 blur-[120px]" />
                <div className="absolute left-1/4 top-1/3 w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-[100px]" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />

                {/* Noise texture */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                    }}
                />
            </div>

            {/* Login card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo & branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/20 mb-6 backdrop-blur-sm">
                        <Shield className="w-8 h-8 text-amber-500" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Store className="w-5 h-5 text-amber-500/70" />
                        <span className="font-serif text-2xl font-semibold text-white">Can Antika</span>
                    </div>
                    <p className="text-sm text-zinc-500 uppercase tracking-[0.25em] font-medium">
                        Yönetim Paneli
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="font-serif text-2xl font-semibold text-white">Admin Girişi</h1>
                        <p className="mt-2 text-sm text-zinc-400">
                            Yönetim paneline erişmek için admin bilgilerinizle giriş yapın
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="admin-email" className="text-zinc-300 text-sm font-medium">
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
                                className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-password" className="text-zinc-300 text-sm font-medium">
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
                                    className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-base border-0 shadow-lg shadow-amber-900/30 transition-all duration-200"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Doğrulanıyor...</>
                            ) : (
                                <><Lock className="h-4 w-4 mr-2" /> Panele Giriş Yap</>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-zinc-600 text-xs">
                        Bu sayfa sadece yetkili yöneticiler içindir
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-2 text-zinc-700 text-xs">
                        <Lock className="h-3 w-3" />
                        <span>256-bit SSL ile korunmaktadır</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
