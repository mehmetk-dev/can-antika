"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, FolderOpen, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { categoryApi, productApi } from "@/lib/api"
import { toast } from "sonner"
import type { CategoryResponse } from "@/lib/types"

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<CategoryResponse[]>([])
    const [productCounts, setProductCounts] = useState<Record<number, number>>({})
    const [isLoading, setIsLoading] = useState(true)

    // Create state
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createName, setCreateName] = useState("")
    const [createDesc, setCreateDesc] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState("")
    const [editDesc, setEditDesc] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        setIsLoading(true)
        try {
            const cats = await categoryApi.getAll()
            setCategories(cats)

            // Fetch product count per category
            const counts: Record<number, number> = {}
            await Promise.all(
                cats.map(async (cat) => {
                    try {
                        const result = await productApi.search({ categoryId: cat.id, page: 0, size: 1 })
                        counts[cat.id] = result.totalElement
                    } catch {
                        counts[cat.id] = 0
                    }
                })
            )
            setProductCounts(counts)
        } catch {
            setCategories([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!createName.trim()) return
        setIsCreating(true)
        try {
            const created = await categoryApi.save({ name: createName.trim(), description: createDesc.trim() || undefined })
            setCategories((prev) => [...prev, created])
            setProductCounts((prev) => ({ ...prev, [created.id]: 0 }))
            setCreateName("")
            setCreateDesc("")
            setIsCreateOpen(false)
            toast.success("Kategori oluşturuldu")
        } catch {
            toast.error("Kategori oluşturulamadı")
        } finally {
            setIsCreating(false)
        }
    }

    const startEdit = (cat: CategoryResponse) => {
        setEditingId(cat.id)
        setEditName(cat.name)
        setEditDesc(cat.description || "")
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditName("")
        setEditDesc("")
    }

    const handleUpdate = async () => {
        if (!editingId || !editName.trim()) return
        setIsSaving(true)
        try {
            const updated = await categoryApi.update(editingId, { name: editName.trim(), description: editDesc.trim() || undefined })
            setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)))
            cancelEdit()
            toast.success("Kategori güncellendi")
        } catch {
            toast.error("Güncelleme başarısız")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        const count = productCounts[id] || 0
        const msg = count > 0
            ? `Bu kategoride ${count} ürün var. Yine de silmek istiyor musunuz?`
            : "Bu kategoriyi silmek istediğinize emin misiniz?"
        if (!confirm(msg)) return
        try {
            await categoryApi.delete(id)
            setCategories((prev) => prev.filter((c) => c.id !== id))
            toast.success("Kategori silindi")
        } catch {
            toast.error("Kategori silinemedi")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Kategoriler</h1>
                    <p className="text-muted-foreground">Ürün kategorilerini yönetin</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Yeni Kategori
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-background">
                        <DialogHeader>
                            <DialogTitle className="font-serif">Yeni Kategori Oluştur</DialogTitle>
                            <DialogDescription>Koleksiyonlarınız için yeni bir kategori ekleyin.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Kategori Adı *</label>
                                <Input
                                    placeholder="örn. Osmanlı Saatleri"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Açıklama</label>
                                <Textarea
                                    placeholder="Kısa açıklama (opsiyonel)"
                                    rows={3}
                                    value={createDesc}
                                    onChange={(e) => setCreateDesc(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full gap-2"
                                disabled={isCreating || !createName.trim()}
                                onClick={handleCreate}
                            >
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                {isCreating ? "Oluşturuluyor..." : "Kategori Oluştur"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Toplam Kategori</p>
                        <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Ürünlü Kategori</p>
                        <p className="text-2xl font-bold text-primary">
                            {categories.filter((c) => (productCounts[c.id] || 0) > 0).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Toplam Ürün</p>
                        <p className="text-2xl font-bold text-accent">
                            {Object.values(productCounts).reduce((a, b) => a + b, 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-serif flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" /> Kategori Listesi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {categories.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
                            <p className="mt-4 text-muted-foreground">Henüz kategori eklenmemiş</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kategori Adı</TableHead>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead className="text-center">Ürün Sayısı</TableHead>
                                    <TableHead className="w-[120px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        {editingId === cat.id ? (
                                            <>
                                                <TableCell>
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={editDesc}
                                                        onChange={(e) => setEditDesc(e.target.value)}
                                                        placeholder="Açıklama"
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center text-muted-foreground">
                                                    {productCounts[cat.id] || 0}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-primary"
                                                            disabled={isSaving || !editName.trim()}
                                                            onClick={handleUpdate}
                                                        >
                                                            <Save className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground"
                                                            onClick={cancelEdit}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell className="font-medium text-foreground">{cat.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{cat.description || "—"}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                                                        {productCounts[cat.id] || 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={() => startEdit(cat)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => handleDelete(cat.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
