"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2, Star, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categoryApi, periodApi } from "@/lib/api"
import { toast } from "sonner"
import { useProductImages } from "@/hooks/useProductImages"
import type { CategoryResponse, PeriodResponse, ProductResponse, ProductRequest } from "@/lib/types"

interface ProductFormProps {
    product?: ProductResponse | null
    onSubmit: (data: ProductRequest) => Promise<void>
    title: string
    subtitle: string
}

export function ProductForm({ product, onSubmit, title, subtitle }: ProductFormProps) {
    const router = useRouter()
    const { images, uploadingCount, fileInputRef, handleImageUpload, removeImage, moveImage, setCoverImage, setImages } =
        useProductImages(product?.imageUrls || [])

    const [categories, setCategories] = useState<CategoryResponse[]>([])
    const [periods, setPeriods] = useState<PeriodResponse[]>([])
    const [categoryId, setCategoryId] = useState(product?.category?.id?.toString() || "")
    const [selectedPeriodId, setSelectedPeriodId] = useState(product?.period?.id?.toString() || "")
    const [customPeriodName, setCustomPeriodName] = useState("")
    const [material, setMaterial] = useState((product?.attributes?.material as string) || "")
    const [status, setStatus] = useState((product?.attributes?.status as string) || "active")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        Promise.all([categoryApi.getAllCached(), periodApi.getAll()])
            .then(([cats, dbPeriods]) => {
                setCategories(cats)
                setPeriods(dbPeriods)
            })
            .catch((e) => {
                const message = e instanceof Error ? e.message : "Kategori ve dönem verileri yüklenemedi"
                toast.error(message)
            })
    }, [])

    // Sync state when product loads (edit mode)
    useEffect(() => {
        if (!product) return
        setImages(product.imageUrls || [])
        setCategoryId(product.category?.id?.toString() || "")
        setSelectedPeriodId(product.period?.id?.toString() || "")
        setMaterial((product.attributes?.material as string) || "")
        setStatus((product.attributes?.status as string) || "active")
    }, [product, setImages])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const parsedCategoryId = Number(categoryId)
        const parsedPrice = Number(formData.get("price"))

        if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) {
            toast.error("Lütfen geçerli bir kategori seçin")
            return
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            toast.error("Lütfen geçerli bir fiyat girin")
            return
        }
        if (images.length === 0) {
            toast.error("Lütfen en az bir görsel yükleyin")
            return
        }

        const selectedPeriod = periods.find((p) => p.id.toString() === selectedPeriodId)
        const resolvedPeriodName = customPeriodName.trim() || selectedPeriod?.name || (product?.period?.name ?? "")

        const data: ProductRequest = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            price: parsedPrice,
            stock: Number(formData.get("stock") || 1),
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
            await onSubmit(data)
        } finally {
            setIsSaving(false)
        }
    }

    const isEdit = !!product

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/urunler">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
                    <p className="mt-1 text-muted-foreground">{subtitle}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card className="bg-card">
                        <CardHeader>
                            <CardTitle className="font-serif">Temel Bilgiler</CardTitle>
                            <CardDescription>
                                {isEdit ? "Ürünün genel bilgilerini düzenleyin" : "Ürünün genel bilgilerini girin"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Ürün Adı *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    defaultValue={product?.title}
                                    placeholder={!isEdit ? "Örn: Osmanlı Dönemi Duvar Saati" : undefined}
                                    required maxLength={255} className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Açıklama *</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    defaultValue={product?.description || ""}
                                    placeholder={!isEdit ? "Ürün hakkında detaylı açıklama..." : undefined}
                                    required maxLength={5000} className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="story">Hikâye / Köken</Label>
                                <Textarea
                                    id="story"
                                    name="story"
                                    rows={4}
                                    defaultValue={(product?.attributes?.provenance as string) || ""}
                                    placeholder={!isEdit ? "Eserin tarihçesi ve köken bilgisi..." : undefined} maxLength={5000} className="bg-muted/50"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader>
                            <CardTitle className="font-serif">Görseller</CardTitle>
                            <CardDescription>
                                {isEdit ? "Ürün fotoğraflarını yönetin" : "Ürün fotoğraflarını yükleyin (maksimum 6 adet)"} · İlk fotoğraf kapak görseli olarak kullanılır.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                                {images.map((image, index) => (
                                    <div key={image} className="relative overflow-hidden rounded-lg bg-muted">
                                        <div className="relative aspect-[4/3]">
                                            <Image src={image} alt={`Ürün ${index + 1}`} fill sizes="20vw" className="object-cover" />
                                        </div>
                                        {index === 0 && (
                                            <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-amber-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white shadow">
                                                <Star className="h-2.5 w-2.5 fill-current" />
                                                <span>Kapak</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-1 py-0.5">
                                            <div className="flex gap-0.5">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => moveImage(index, index - 1)}
                                                    className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-white hover:bg-white/40 disabled:opacity-30"
                                                >
                                                    <ChevronLeft className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === images.length - 1}
                                                    onClick={() => moveImage(index, index + 1)}
                                                    className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-white hover:bg-white/40 disabled:opacity-30"
                                                >
                                                    <ChevronRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                            {index !== 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCoverImage(index)}
                                                    className="flex h-5 items-center justify-center rounded bg-amber-500/90 px-1.5 text-[10px] font-semibold text-white hover:bg-amber-500"
                                                >
                                                    Kapak Yap
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {images.length < 6 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingCount > 0}
                                        className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                                    >
                                        {uploadingCount > 0 ? (
                                            <>
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                <span className="mt-1 text-xs">{uploadingCount} yükleniyor...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-6 w-6" />
                                                <span className="mt-1 text-xs">Yükle</span>
                                                <span className="mt-0.5 text-[10px] opacity-60">Çoklu seçim</span>
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
                            {!isEdit && <CardDescription>Ürünün fiziksel özellikleri ve durumu</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="dimensions">Boyutlar{!isEdit && " *"}</Label>
                                    <Input
                                        id="dimensions"
                                        name="dimensions"
                                        defaultValue={(product?.attributes?.dimensions as string) || ""}
                                        placeholder="Örn: 65cm x 35cm x 15cm"
                                        required={!isEdit}
                                        className="bg-muted/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="condition">Durum{!isEdit && " *"}</Label>
                                    <Input
                                        id="condition"
                                        name="condition"
                                        defaultValue={(product?.attributes?.condition as string) || ""}
                                        placeholder="Örn: Mükemmel durumda"
                                        required={!isEdit}
                                        className="bg-muted/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="conditionDetails">Durum Detayları</Label>
                                <Textarea
                                    id="conditionDetails"
                                    name="conditionDetails"
                                    rows={3}
                                    defaultValue={(product?.attributes?.conditionDetails as string) || ""}
                                    placeholder="Aşınma, restorasyon vb. detaylar..."
                                    className="bg-muted/50"
                                />
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
                                <Label>Stok Durumu{!isEdit && " *"}</Label>
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
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    defaultValue={product?.price}
                                    placeholder={!isEdit ? "0" : undefined}
                                    required
                                    className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stock">Stok Adedi{!isEdit && " *"}</Label>
                                <Input id="stock" name="stock" type="number" min={0} defaultValue={product?.stock ?? 1} className="bg-muted/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader>
                            <CardTitle className="font-serif">Sınıflandırma</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Kategori{!isEdit && " *"}</Label>
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
                                        if (value) setCustomPeriodName("")
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
                                        if (e.target.value.trim().length > 0) setSelectedPeriodId("")
                                    }}
                                    placeholder="Örn: Geç Osmanlı"
                                    className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="material">Malzeme</Label>
                                <Input
                                    id="material"
                                    value={material}
                                    onChange={(e) => setMaterial(e.target.value)}
                                    placeholder="Örn: Ahşap, Pirinç, Seramik"
                                    className="bg-muted/50"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                            İptal
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
