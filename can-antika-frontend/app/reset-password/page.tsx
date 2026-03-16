"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const token = useMemo(() => searchParams.get("token") || "", [searchParams])
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) {
            toast.error("Şifre sıfırlama tokenı bulunamadı.")
            return
        }
        if (newPassword.length < 6) {
            toast.error("Yeni şifre en az 6 karakter olmalı.")
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error("Şifreler eşleşmiyor.")
            return
        }

        setLoading(true)
        try {
            await authApi.resetPassword({ token, newPassword })
            toast.success("Şifren başarıyla güncellendi.")
            setNewPassword("")
            setConfirmPassword("")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Şifre değiştirilemedi.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Yeni Şifre Belirle</CardTitle>
                        <CardDescription>
                            Hesabın için yeni bir şifre belirle.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Yeni Şifre</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Yeni Şifre Tekrar</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={6}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading || !token}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Güncelleniyor...
                                    </>
                                ) : (
                                    "Şifreyi Güncelle"
                                )}
                            </Button>
                        </form>

                        {!token && (
                            <p className="mt-3 text-sm text-destructive">
                                Geçersiz bağlantı. E-postadaki tam linki açtığından emin ol.
                            </p>
                        )}

                        <p className="mt-4 text-center text-sm text-muted-foreground">
                            <Link href="/giris" className="text-primary hover:underline">
                                Giriş ekranına dön
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    )
}
