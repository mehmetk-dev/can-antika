"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, FolderOpen, Save, X, ImagePlus, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { categoryApi, fileApi } from "@/lib/api"
import { resolveImageUrl } from "@/lib/product/image-url"
import { toast } from "sonner"
import type { CategoryResponse } from "@/lib/types"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [productCounts, setProductCounts] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", desc: "", coverImageUrl: "", isSaving: false, isUploading: false })

  const [editForm, setEditForm] = useState<{
    id: number | null
    name: string
    desc: string
    coverImageUrl: string
    isSaving: boolean
    isUploading: boolean
  }>({ id: null, name: "", desc: "", coverImageUrl: "", isSaving: false, isUploading: false })

  useEffect(() => {
    void loadCategories()
  }, [])

  const resetCreateForm = () => {
    setCreateForm({ name: "", desc: "", coverImageUrl: "", isSaving: false, isUploading: false })
  }

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open)
    if (!open) resetCreateForm()
  }

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const [cats, countsFromApi] = await Promise.all([
        categoryApi.getAll(),
        categoryApi.getProductCounts().catch(() => ({} as Record<string, number>)),
      ])
      setCategories(cats)
      const counts: Record<number, number> = {}
      Object.entries(countsFromApi).forEach(([categoryId, count]) => {
        const parsedId = Number(categoryId)
        if (Number.isFinite(parsedId) && parsedId > 0) {
          counts[parsedId] = Number(count) || 0
        }
      })
      setProductCounts(counts)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kategoriler yüklenemedi"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const uploadCoverImage = async (file: File, mode: "create" | "edit") => {
    const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])
    const allowedExtensions = new Set(["jpg", "jpeg", "png", "gif", "webp"])
    const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "" : ""
    const hasAllowedType = allowedMimeTypes.has((file.type || "").toLowerCase())
    const hasAllowedExt = allowedExtensions.has(ext)

    if (!(hasAllowedType || hasAllowedExt)) {
      toast.error("Desteklenmeyen görsel formatı. Lütfen JPEG, PNG, GIF veya WebP seçin.")
      return
    }

    if (mode === "create") setCreateForm(prev => ({ ...prev, isUploading: true }))
    if (mode === "edit") setEditForm(prev => ({ ...prev, isUploading: true }))

    try {
      const uploadedUrl = await fileApi.upload(file)
      if (mode === "create") setCreateForm(prev => ({ ...prev, coverImageUrl: uploadedUrl }))
      if (mode === "edit") setEditForm(prev => ({ ...prev, coverImageUrl: uploadedUrl }))
      toast.success("Kapak görseli yüklendi")
    } catch {
      toast.error("Kapak görseli yüklenemedi")
    } finally {
      if (mode === "create") setCreateForm(prev => ({ ...prev, isUploading: false }))
      if (mode === "edit") setEditForm(prev => ({ ...prev, isUploading: false }))
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) return

    setCreateForm(prev => ({ ...prev, isSaving: true }))
    try {
      const created = await categoryApi.save({
        name: createForm.name.trim(),
        description: createForm.desc.trim() || undefined,
        coverImageUrl: createForm.coverImageUrl || undefined,
      })
      setCategories((prev) => [...prev, created])
      setProductCounts((prev) => ({ ...prev, [created.id]: 0 }))
      resetCreateForm()
      setIsCreateOpen(false)
      toast.success("Kategori oluşturuldu")
    } catch {
      toast.error("Kategori oluşturulamadı")
    } finally {
      setCreateForm(prev => ({ ...prev, isSaving: false }))
    }
  }

  const startEdit = (cat: CategoryResponse) => {
    setEditForm({ id: cat.id, name: cat.name, desc: cat.description || "", coverImageUrl: cat.coverImageUrl || "", isSaving: false, isUploading: false })
  }

  const cancelEdit = () => {
    setEditForm({ id: null, name: "", desc: "", coverImageUrl: "", isSaving: false, isUploading: false })
  }

  const handleUpdate = async () => {
    if (!editForm.id || !editForm.name.trim()) return

    setEditForm(prev => ({ ...prev, isSaving: true }))
    try {
      const updated = await categoryApi.update(editForm.id, {
        name: editForm.name.trim(),
        description: editForm.desc.trim() || undefined,
        coverImageUrl: editForm.coverImageUrl || undefined,
      })
      setCategories((prev) => prev.map((c) => (c.id === editForm.id ? updated : c)))
      cancelEdit()
      toast.success("Kategori güncellendi")
    } catch {
      toast.error("Güncelleme başarısız")
    } finally {
      setEditForm(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newCategories = [...categories]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newCategories.length) return
      ;[newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]]
    setCategories(newCategories)
    setIsReordering(true)
    try {
      await categoryApi.reorder(newCategories.map((c) => c.id))
      toast.success("Sıralama güncellendi")
    } catch {
      setCategories(categories)
      toast.error("Sıralama güncellenemedi")
    } finally {
      setIsReordering(false)
    }
  }

  const handleDelete = async (id: number) => {
    const count = productCounts[id] || 0
    const msg =
      count > 0
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Kategoriler</h1>
          <p className="text-muted-foreground">Ürün kategorilerini yönetin</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Kategori
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl bg-background">
            <DialogHeader>
              <DialogTitle className="font-serif">Yeni Kategori Oluştur</DialogTitle>
              <DialogDescription>İsim, açıklama ve kapak görseliyle güçlü bir kategori kartı hazırlayın.</DialogDescription>
            </DialogHeader>

            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <div className="space-y-4 rounded-xl border bg-card p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Kategori Adı *</label>
                  <Input
                    placeholder="Örn. Osmanlı Saatleri"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Açıklama</label>
                  <Textarea
                    placeholder="Kısa açıklama (opsiyonel)"
                    rows={4}
                    value={createForm.desc}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, desc: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-dashed bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">Kapak Görseli</p>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {createForm.coverImageUrl ? (
                    <Image
                      src={resolveImageUrl(createForm.coverImageUrl)}
                      alt="Kategori kapak önizleme"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void uploadCoverImage(file, "create")
                        e.currentTarget.value = ""
                      }}
                    />
                    {createForm.isUploading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Yükleniyor...
                      </span>
                    ) : (
                      "Kapak Görseli Seç"
                    )}
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={!createForm.coverImageUrl}
                    onClick={() => setCreateForm(prev => ({ ...prev, coverImageUrl: "" }))}
                  >
                    Temizle
                  </Button>
                </div>
              </div>
            </div>

            <Button
              className="mt-2 w-full gap-2"
              disabled={createForm.isSaving || !createForm.name.trim() || createForm.isUploading}
              onClick={handleCreate}
            >
              {createForm.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {createForm.isSaving ? "Oluşturuluyor..." : "Kategori Oluştur"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

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
            <p className="text-2xl font-bold text-primary">{categories.filter((c) => (productCounts[c.id] || 0) > 0).length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Toplam Ürün</p>
            <p className="text-2xl font-bold text-accent">{Object.values(productCounts).reduce((a, b) => a + b, 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <FolderOpen className="h-5 w-5" /> Kategori Listesi
          </CardTitle>
        </CardHeader>

        <CardContent>
          {categories.length === 0 ? (
            <div className="py-12 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">Henüz kategori eklenmemiş</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Kapak</TableHead>
                  <TableHead>Kategori Adı</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-center">Ürün Sayısı</TableHead>
                  <TableHead className="w-[180px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    {editForm.id === cat.id ? (
                      <>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="relative h-14 w-20 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={resolveImageUrl(editForm.coverImageUrl)}
                                alt={`${cat.name} kapak`}
                                fill
                                unoptimized
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>

                            <label className="inline-flex cursor-pointer items-center text-xs font-medium text-primary hover:underline">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) void uploadCoverImage(file, "edit")
                                  e.currentTarget.value = ""
                                }}
                              />
                              {editForm.isUploading ? "Yükleniyor..." : "Görsel değiştir"}
                            </label>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="h-8" />
                        </TableCell>

                        <TableCell>
                          <Input
                            value={editForm.desc}
                            onChange={(e) => setEditForm(prev => ({ ...prev, desc: e.target.value }))}
                            placeholder="Açıklama"
                            className="h-8"
                          />
                        </TableCell>

                        <TableCell className="text-center text-muted-foreground">{productCounts[cat.id] || 0}</TableCell>

                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              disabled={editForm.isSaving || !editForm.name.trim() || editForm.isUploading}
                              onClick={handleUpdate}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <div className="relative h-14 w-20 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={resolveImageUrl(cat.coverImageUrl)}
                              alt={`${cat.name} kapak`}
                              fill
                              unoptimized
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                        </TableCell>

                        <TableCell className="font-medium text-foreground">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground">{cat.description || "-"}</TableCell>

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
                              disabled={isReordering || categories.indexOf(cat) === 0}
                              onClick={() => handleMove(categories.indexOf(cat), "up")}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              disabled={isReordering || categories.indexOf(cat) === categories.length - 1}
                              onClick={() => handleMove(categories.indexOf(cat), "down")}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => startEdit(cat)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id)}>
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
