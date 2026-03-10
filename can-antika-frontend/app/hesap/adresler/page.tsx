"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AuthGuard } from "@/components/auth-guard"
import { addressApi } from "@/lib/api"
import { toast } from "sonner"
import type { AddressResponse, AddressRequest } from "@/lib/types"

function AddressesContent() {
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    addressApi
      .getMyAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]))
      .finally(() => setIsLoading(false))
  }, [])

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: AddressRequest = {
      title: formData.get("title") as string,
      country: (formData.get("country") as string) || "Türkiye",
      city: formData.get("city") as string,
      district: formData.get("district") as string,
      postalCode: formData.get("postalCode") as string,
      addressLine: formData.get("addressLine") as string,
    }

    setIsSaving(true)
    try {
      if (editingAddress) {
        const updated = await addressApi.update(editingAddress.id, data)
        setAddresses((prev) => prev.map((a) => (a.id === editingAddress.id ? updated : a)))
        toast.success("Adres güncellendi")
      } else {
        const created = await addressApi.save(data)
        setAddresses((prev) => [...prev, created])
        toast.success("Adres eklendi")
      }
      setIsDialogOpen(false)
      setEditingAddress(null)
    } catch {
      toast.error("Adres kaydedilirken hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return
    try {
      await addressApi.delete(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      toast.success("Adres silindi")
    } catch {
      toast.error("Adres silinirken hata oluştu")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Adresler yükleniyor...</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Adreslerim</h1>
          <p className="mt-2 text-muted-foreground">Kayıtlı teslimat adreslerinizi yönetin</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => setEditingAddress(null)}>
              <Plus className="h-4 w-4" />
              Yeni Adres
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-background">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}
              </DialogTitle>
              <DialogDescription>Teslimat adresinizi girin</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveAddress} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Adres Başlığı</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Örn: Ev, İş"
                    defaultValue={editingAddress?.title}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Ülke</Label>
                  <Input
                    id="country"
                    name="country"
                    defaultValue={editingAddress?.country || "Türkiye"}
                    required
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine">Adres</Label>
                <Textarea
                  id="addressLine"
                  name="addressLine"
                  rows={2}
                  defaultValue={editingAddress?.addressLine}
                  required
                  className="bg-muted/50"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">İl</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={editingAddress?.city}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">İlçe</Label>
                  <Input
                    id="district"
                    name="district"
                    defaultValue={editingAddress?.district}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Posta Kodu</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    defaultValue={editingAddress?.postalCode}
                    required
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setIsDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground" disabled={isSaving}>
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-foreground">{address.title}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingAddress(address)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>{address.addressLine}</p>
                  <p>
                    {address.district}, {address.city} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-serif text-xl text-foreground">Kayıtlı adresiniz yok</p>
          <p className="mt-2 text-muted-foreground">Teslimat için adres ekleyin</p>
        </div>
      )}
    </>
  )
}

export default function AddressesPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <DashboardSidebar />
            <div className="flex-1">
              <AddressesContent />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  )
}
