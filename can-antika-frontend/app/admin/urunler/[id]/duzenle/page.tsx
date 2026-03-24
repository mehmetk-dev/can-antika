"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect, useRef, use } from "react"
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
import { materials } from "@/lib/products"
import type { CategoryResponse, PeriodResponse, ProductResponse, ProductRequest } from "@/lib/types"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<ProductResponse | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [periods, setPeriods] = useState<PeriodResponse[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [selectedPeriodId, setSelectedPeriodId] = useState("")
  const [customPeriodName, setCustomPeriodName] = useState("")
  const [material, setMaterial] = useState("")
  const [status, setStatus] = useState("active")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([productApi.getById(Number(id)), categoryApi.getAll(), periodApi.getAll()])
      .then(([prod, cats, dbPeriods]) => {
        setProduct(prod)
        setCategories(cats)
        setPeriods(dbPeriods)
        setImages(prod.imageUrls || [])
        setCategoryId(prod.category?.id?.toString() || "")
        setSelectedPeriodId(prod.period?.id?.toString() || "")
        setCustomPeriodName("")
        setMaterial((prod.attributes?.material as string) || "")
        setStatus((prod.attributes?.status as string) || "active")
        setIsLoading(false)
      })
      .catch(() => {
        toast.error("Ürün yüklenemedi")
        setIsLoading(false)
      })
  }, [id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const selectedPeriod = periods.find((p) => p.id.toString() === selectedPeriodId)
    const resolvedPeriodName = customPeriodName.trim() || selectedPeriod?.name || (product?.period?.name ?? "")

    const data: ProductRequest = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock") || 1),
      categoryId: Number(categoryId),
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
      await productApi.update(Number(id), data)
      toast.success("Ürün başarıyla güncellendi")
      router.push("/admin/urunler")
    } catch {
      toast.error("Güncelleme sırasında hata oluştu")
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
      toast.error(`${oversized.length} dosya 100MB sınırını aşıyor, atlandı.`)
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
        toast.error(`"${file.name}" yüklenemedi`)
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Ürün yükleniyor...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-muted-foreground">Ürün bulunamadı</p>
        <Link href="/admin/urunler">
          <Button variant="outline" className="mt-4">Ürünlere Dön</Button>
        </Link>
      </div>
    )
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
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Ürünü Düzenle</h1>
          <p className="mt-1 text-muted-foreground">CAN-{product.id.toString().padStart(4, "0")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif">Temel Bilgiler</CardTitle>
              <CardDescription>Ürünün genel bilgilerini düzenleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Ürün Adı *</Label>
                <Input id="title" name="title" defaultValue={product.title} required className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea id="description" name="description" rows={4} defaultValue={product.description || ""} required className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="story">Hikâye / Köken</Label>
                <Textarea id="story" name="story" rows={4} defaultValue={(product.attributes?.provenance as string) || ""} className="bg-muted/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif">Görseller</CardTitle>
              <CardDescription>Ürün fotoğraflarını yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <div className="grid gap-4 sm:grid-cols-3">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <Image src={image} alt={`Ürün ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" unoptimized />
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
                        <span className="mt-2 text-sm">{uploadingCount} yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8" />
                        <span className="mt-2 text-sm">Yükle</span>
                        <span className="mt-0.5 text-xs opacity-60">Çoklu seçim yapabilirsiniz</span>
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Boyutlar</Label>
                  <Input id="dimensions" name="dimensions" defaultValue={(product.attributes?.dimensions as string) || ""} className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Durum</Label>
                  <Input id="condition" name="condition" defaultValue={(product.attributes?.condition as string) || ""} className="bg-muted/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditionDetails">Durum Detayları</Label>
                <Textarea id="conditionDetails" name="conditionDetails" rows={3} defaultValue={(product.attributes?.conditionDetails as string) || ""} className="bg-muted/50" />
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
                <Label>Stok Durumu</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif (Satışta)</SelectItem>
                    <SelectItem value="sold">Satıldı</SelectItem>
                    <SelectItem value="reserved">Rezerve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Fiyat (TL) *</Label>
                <Input id="price" name="price" type="number" defaultValue={product.price} required className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok Adedi</Label>
                <Input id="stock" name="stock" type="number" defaultValue={product.stock ?? 1} className="bg-muted/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif">Sınıflandırma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dönem</Label>
                <Select
                  value={selectedPeriodId}
                  onValueChange={(value) => {
                    setSelectedPeriodId(value)
                    if (value) {
                      setCustomPeriodName("")
                    }
                  }}
                >
                  <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Mevcut dönem seçin" /></SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={period.id.toString()}>{period.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customPeriodName">Yeni Dönem Ekle</Label>
                <Input
                  id="customPeriodName"
                  value={customPeriodName}
                  onChange={(e) => {
                    setCustomPeriodName(e.target.value)
                    if (e.target.value.trim().length > 0) {
                      setSelectedPeriodId("")
                    }
                  }}
                  placeholder="Örn: Erken Cumhuriyet"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Malzeme</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    {materials.map((mat) => (
                      <SelectItem key={mat.value} value={mat.value}>{mat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
              İptal
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-primary-foreground" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
