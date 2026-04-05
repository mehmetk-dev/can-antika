"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils"

interface LoginFormProps {
    onSuccess: () => void
    onSwitchToRegister: () => void
    prefillEmail?: string
}

export function LoginForm({ onSuccess, onSwitchToRegister, prefillEmail }: LoginFormProps) {
    const { login } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loginData, setLoginData] = useState({
        email: prefillEmail ?? "",
        password: "",
        rememberMe: false,
    })

    useEffect(() => {
        if (prefillEmail) setLoginData((prev) => ({ ...prev, email: prefillEmail }))
    }, [prefillEmail])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await login({ email: loginData.email, password: loginData.password })
            toast.success("Giriş başarılı!")
            onSuccess()
        } catch (error) {
            toast.error(getErrorMessage(error, "Giriş başarısız"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
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

            {/* Google Login — external OAuth2 redirect, not a Next.js page */}
            <a
                href={`${process.env.NEXT_PUBLIC_API_URL || ""}/oauth2/authorization/google`}
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
                        onClick={onSwitchToRegister}
                        className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                        Kayıt Olun
                    </button>
                </p>
            </div>

            <div className="mt-8 pt-6 border-t border-border/30">
                <p className="text-center text-sm text-muted-foreground">256-bit SSL şifreleme ile güvende</p>
            </div>
        </>
    )
}
