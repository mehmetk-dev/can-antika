"use client"

import type React from "react"
import { useState } from "react"
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth/auth-context"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils"

interface RegisterFormProps {
    onSwitchToLogin: (prefillEmail?: string) => void
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
    const { register } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [registerData, setRegisterData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
    })

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
            onSwitchToLogin(registerData.email)
        } catch (error) {
            toast.error(getErrorMessage(error, "Kayıt başarısız"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <div className="mb-6">
                <button
                    onClick={() => onSwitchToLogin()}
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
                            minLength={2}
                            maxLength={50}
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
                            minLength={2}
                            maxLength={50}
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
                        onClick={() => onSwitchToLogin()}
                        className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                        Giriş Yapın
                    </button>
                </p>
            </div>
        </>
    )
}
