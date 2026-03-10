"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const nameParts = user?.name?.split(" ") || [""]
  const [formData, setFormData] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: user?.email || "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullName = `${formData.firstName} ${formData.lastName}`.trim()
    if (!fullName) {
      toast.error("İsim boş olamaz")
      return
    }

    // Check if name is same as current (case insensitive & trimmed)
    if (fullName.toLowerCase() === (user?.name || "").trim().toLowerCase()) {
      toast.error("Yeni isim eskisiyle aynı olamaz")
      return
    }

    setIsUpdatingProfile(true)
    try {
      await authApi.updateProfile({ name: fullName })
      await refreshUser()
      toast.success("Profil güncellendi")
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Profil güncellenemedi")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error("Şifreler eşleşmiyor")
      return
    }
    setIsChangingPassword(true)
    try {
      await authApi.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      toast.success("Şifre güncellendi")
      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" })
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Şifre güncellenemedi")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <DashboardSidebar />

            <div className="flex-1">
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Hesabım</h1>
                <p className="mt-2 text-muted-foreground">Hesap bilgilerinizi görüntüleyin ve düzenleyin</p>
              </div>

              {/* Profile Card */}
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">Profil Bilgileri</CardTitle>
                  <CardDescription>Kişisel bilgilerinizi güncelleyin</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Ad</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                          className="bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Soyad</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                          className="bg-muted/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-muted/50 cursor-not-allowed opacity-70"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" className="bg-primary text-primary-foreground" disabled={isUpdatingProfile}>
                        {isUpdatingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor...</> : "Kaydet"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Password Card */}
              <Card className="mt-6 bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">Şifre Değiştir</CardTitle>
                  <CardDescription>Hesap güvenliğiniz için şifrenizi güncelleyin</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        className="bg-muted/50"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Yeni Şifre</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                          className="bg-muted/50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Yeni Şifre Tekrar</Label>
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          value={passwordData.confirmNewPassword}
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                          className="bg-muted/50"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isChangingPassword} className="bg-primary text-primary-foreground">
                        {isChangingPassword ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Güncelleniyor...</>
                        ) : (
                          "Şifreyi Güncelle"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  )
}
