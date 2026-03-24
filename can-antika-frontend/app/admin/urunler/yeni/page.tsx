"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { productApi, categoryApi, periodApi, fileApi } from "@/lib/api"
import { toast } from "sonner"
import type { CategoryResponse, PeriodResponse, ProductRequest } from "@/lib/types"

export default function NewProductPage() {
  const router = useRouter()
  const [images, setImages] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [periods, setPeriods] = useState<PeriodResponse[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [selectedPeriodId, setSelectedPeriodId] = useState("")
  const [customPeriodName, setCustomPeriodName] = useState("")
  const [material, setMaterial] = useState("")
  const [status, setStatus] = useState("active")
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([categoryApi.getAll(), periodApi.getAll()])
      .then(([cats, dbPeriods]) => {
        setCategories(cats)
        setPeriods(dbPeriods)
      })
      .catch((e) => console.error("Liste verileri alinamadi:", e))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const parsedCategoryId = Number(categoryId)
    const parsedPrice = Number(formData.get("price"))

    if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) {
      toast.error("Lutfen gecerli bir kategori secin")
      return
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error("Lutfen gecerli bir fiyat girin")
      return
    }

    const selectedPeriod = periods.find((p) => p.id.toString() === selectedPeriodId)
    const resolvedPeriodName = customPeriodName.trim() || selectedPeriod?.name || ""

    const data: ProductRequest = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: parsedPrice,
      stock: 1,
      categoryId: parsedCategoryId,
      periodId: selectedPeriod ? selectedPeriod.id : undefined,
      periodName: customPeriodName.trim() || undefined,
      imageUrls: images,
      attributes: {
        era: resolvedPeriodName,
        material,
        status,
        dimensions: formData.get("dimensions") as string,
        condition: formData.get("condition") as string,
        conditionDetails: formData.get("conditionDetails") as string,
        provenance: formData.get("story") as string,
      },
    }

    setIsSaving(true)
    try {
      await productApi.save(data)
      toast.success("Urun basariyla eklendi")
      router.push("/admin/urunler")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Urun eklenirken hata olustu"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const maxSlots = 6 - images.length
    const selectedFiles = Array.from(files).slice(0, maxSlots)

    const oversized = selectedFiles.filter((f) => f.size > 100 * 1024 * 1024)
    if (oversized.length > 0) {
      toast.error(`${oversized.length} dosya 100MB sinirini asiyor, atlandi.`)
    }

    const validFiles = selectedFiles.filter((f) => f.size <= 100 * 1024 * 1024)
    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setUploadingCount(validFiles.length)

    const uploadPromises = validFiles.map(async (file) => {
      try {
        const url = await fileApi.upload(file)
        setImages((prev) => {
          if (prev.length >= 6) return prev
          return [...prev, url]
        })
      } catch {
        toast.error(`"${file.name}" yuklenemedi`)
      } finally {
        setUploadingCount((prev) => prev - 1)
      }
    })

    await Promise.allSettled(uploadPromises)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/urunler">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Yeni Urun Ekle</h1>
          <p className="mt-1 text-muted-foreground">Koleksiyonunuza yeni bir eser ekleyin</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif">Temel Bilgiler</CardTitle>
              <CardDescription>Urunun genel bilgilerini girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Urun Adi *</Label>
                <Input id="title" name="title" placeholder="Orn: Osmanli Donemi Duvar Saati" required className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Aciklama *</Label>
                <Textarea id="description" name="description" rows={4} placeholder="Urun hakkinda detayli aciklama..." required className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="story">Hikaye / Koken</Label>
                <Textarea id="story" name="story" rows={4} placeholder="Eserin tarihcesi ve koken bilgisi..." className="bg-muted/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif">Gorseller</CardTitle>
              <CardDescription>Urun fotograflarini yukleyin (maksimum 6 adet)</CardDescription>
            </CardHeader>
            <CardContent>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <div className="grid gap-4 sm:grid-cols-3">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <Image src={image} alt={`Urun ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {images.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCount > 0}
                    className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {uploadingCount > 0 ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="mt-2 text-sm">{uploadingCount} yukleniyor...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8" />
                        <span className="mt-2 text-sm">Yukle</span>
                        <span className="mt-0.5 text-xs opacity-60">Coklu secim yapabilirsiniz</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif">Detaylar</CardTitle>
              <CardDescription>Urunun fiziksel ozellikleri ve durumu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Boyutlar *</Label>
                  <Input id="dimensions" name="dimensions" placeholder="Orn: 65cm x 35cm x 15cm" required className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Durum *</Label>
                  <Input id="condition" name="condition" placeholder="Orn: Mukemmel durumda" required className="bg-muted/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditionDetails">Durum Detaylari</Label>
                <Textarea id="conditionDetails" name="conditionDetails" rows={3} placeholder="Asinma, restorasyon vb. detaylar..." className="bg-muted/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif">Durum ve Fiyat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Stok Durumu *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif (Satista)</SelectItem>
                    <SelectItem value="sold">Satildi</SelectItem>
                    <SelectItem value="reserved">Rezerve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Fiyat (TL) *</Label>
                <Input id="price" name="price" type="number" placeholder="0" required className="bg-muted/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif">Siniflandirma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Donem</Label>
                <Select
                  value={selectedPeriodId}
                  onValueChange={(value) => {
                    setSelectedPeriodId(value)
                    if (value) {
                      setCustomPeriodName("")
                    }
                  }}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Mevcut donem secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={period.id.toString()}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customPeriodName">Yeni Donem Ekle</Label>
                <Input
                  id="customPeriodName"
                  value={customPeriodName}
                  onChange={(e) => {
                    setCustomPeriodName(e.target.value)
                    if (e.target.value.trim().length > 0) {
                      setSelectedPeriodId("")
                    }
                  }}
                  placeholder="Orn: Gec Osmanli"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Malzeme</Label>
                <Input
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Orn: Ahsap, Pirinc, Gumus"
                  className="bg-muted/50"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
              Iptal
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-primary-foreground" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
