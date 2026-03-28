"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categoryApi, periodApi } from "@/lib/api"
import { materials } from "@/lib/product/products"
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
    const { images, uploadingCount, fileInputRef, handleImageUpload, removeImage, setImages } =
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
        Promise.all([categoryApi.getAll(), periodApi.getAll()])
            .then(([cats, dbPeriods]) => {
                setCategories(cats)
                setPeriods(dbPeriods)
            })
            .catch((e) => {
                const message = e instanceof Error ? e.message : "Kategori ve d\u00F6nem verileri y\u00FCklenemedi"
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
            toast.error("L\u00FCtfen ge\u00E7erli bir kategori se\u00E7in")
            return
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            toast.error("L\u00FCtfen ge\u00E7erli bir fiyat girin")
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
                                {isEdit ? "\u00DCr\u00FCn\u00FCn genel bilgilerini d\u00FCzenleyin" : "\u00DCr\u00FCn\u00FCn genel bilgilerini girin"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">\u00DCr\u00FCn Ad\u0131 *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    defaultValue={product?.title}
                                    placeholder={!isEdit ? "\u00D6rn: Osmanl\u0131 D\u00F6nemi Duvar Saati" : undefined}
                                    required maxLength={255} className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">A\u00E7\u0131klama *</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    defaultValue={product?.description || ""}
                                    placeholder={!isEdit ? "\u00DCr\u00FCn hakk\u0131nda detayl\u0131 a\u00E7\u0131klama..." : undefined}
                                    required maxLength={5000} className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="story">Hik\u00E2ye / K\u00F6ken</Label>
                                <Textarea
                                    id="story"
                                    name="story"
                                    rows={4}
                                    defaultValue={(product?.attributes?.provenance as string) || ""}
                                    placeholder={!isEdit ? "Eserin tarih\u00E7esi ve k\u00F6ken bilgisi..." : undefined} maxLength={5000} className="bg-muted/50"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader>
                            <CardTitle className="font-serif">G\u00F6rseller</CardTitle>
                            <CardDescription>
                                {isEdit ? "\u00DCr\u00FCn foto\u011Fraflar\u0131n\u0131 y\u00F6netin" : "\u00DCr\u00FCn foto\u011Fraflar\u0131n\u0131 y\u00FCkleyin (maksimum 6 adet)"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                            <div className="grid gap-4 sm:grid-cols-3">
                                {images.map((image, index) => (
                                    <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                                        <Image src={image} alt={`\u00DCr\u00FCn ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" unoptimized />
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
                                                <span className="mt-2 text-sm">{uploadingCount} y\u00FCkleniyor...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8" />
                                                <span className="mt-2 text-sm">Y\u00FCkle</span>
                                                <span className="mt-0.5 text-xs opacity-60">\u00C7oklu se\u00E7im yapabilirsiniz</span>
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
                            {!isEdit && <CardDescription>\u00DCr\u00FCn\u00FCn fiziksel \u00F6zellikleri ve durumu</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="dimensions">Boyutlar{!isEdit && " *"}</Label>
                                    <Input
                                        id="dimensions"
                                        name="dimensions"
                                        defaultValue={(product?.attributes?.dimensions as string) || ""}
                                        placeholder="\u00D6rn: 65cm x 35cm x 15cm"
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
                                        placeholder="\u00D6rn: M\u00FCkemmel durumda"
                                        required={!isEdit}
                                        className="bg-muted/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="conditionDetails">Durum Detaylar\u0131</Label>
                                <Textarea
                                    id="conditionDetails"
                                    name="conditionDetails"
                                    rows={3}
                                    defaultValue={(product?.attributes?.conditionDetails as string) || ""}
                                    placeholder="A\u015F\u0131nma, restorasyon vb. detaylar..."
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
                                        <SelectItem value="active">Aktif (Sat\u0131\u015Fta)</SelectItem>
                                        <SelectItem value="sold">Sat\u0131ld\u0131</SelectItem>
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
                            {isEdit && (
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stok Adedi</Label>
                                    <Input id="stock" name="stock" type="number" defaultValue={product?.stock ?? 1} className="bg-muted/50" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader>
                            <CardTitle className="font-serif">S\u0131n\u0131fland\u0131rma</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Kategori{!isEdit && " *"}</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Se\u00E7in" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>D\u00F6nem</Label>
                                <Select
                                    value={selectedPeriodId}
                                    onValueChange={(value) => {
                                        setSelectedPeriodId(value)
                                        if (value) setCustomPeriodName("")
                                    }}
                                >
                                    <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Mevcut d\u00F6nem se\u00E7in" /></SelectTrigger>
                                    <SelectContent>
                                        {periods.map((period) => (
                                            <SelectItem key={period.id} value={period.id.toString()}>{period.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customPeriodName">Yeni D\u00F6nem Ekle</Label>
                                <Input
                                    id="customPeriodName"
                                    value={customPeriodName}
                                    onChange={(e) => {
                                        setCustomPeriodName(e.target.value)
                                        if (e.target.value.trim().length > 0) setSelectedPeriodId("")
                                    }}
                                    placeholder="\u00D6rn: Ge\u00E7 Osmanl\u0131"
                                    className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Malzeme</Label>
                                <Select value={material} onValueChange={setMaterial}>
                                    <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Se\u00E7in" /></SelectTrigger>
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
                            \u0130ptal
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
