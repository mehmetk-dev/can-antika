"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, FolderOpen, Save, X, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { categoryApi, fileApi, productApi } from "@/lib/api"
import { resolveImageUrl } from "@/lib/image-url"
import { toast } from "sonner"
import type { CategoryResponse } from "@/lib/types"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [productCounts, setProductCounts] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createDesc, setCreateDesc] = useState("")
  const [createCoverImageUrl, setCreateCoverImageUrl] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isUploadingCreateCover, setIsUploadingCreateCover] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editCoverImageUrl, setEditCoverImageUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingEditCover, setIsUploadingEditCover] = useState(false)

  useEffect(() => {
    void loadCategories()
  }, [])

  const resetCreateForm = () => {
    setCreateName("")
    setCreateDesc("")
    setCreateCoverImageUrl("")
  }

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open)
    if (!open) resetCreateForm()
  }

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const cats = await categoryApi.getAll()
      setCategories(cats)

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
      setProductCounts({})
    } finally {
      setIsLoading(false)
    }
  }

  const uploadCoverImage = async (file: File, mode: "create" | "edit") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen görsel bir dosya seçin")
      return
    }

    if (mode === "create") setIsUploadingCreateCover(true)
    if (mode === "edit") setIsUploadingEditCover(true)

    try {
      const uploadedUrl = await fileApi.upload(file)
      if (mode === "create") setCreateCoverImageUrl(uploadedUrl)
      if (mode === "edit") setEditCoverImageUrl(uploadedUrl)
      toast.success("Kapak görseli yüklendi")
    } catch {
      toast.error("Kapak görseli yüklenemedi")
    } finally {
      if (mode === "create") setIsUploadingCreateCover(false)
      if (mode === "edit") setIsUploadingEditCover(false)
    }
  }

  const handleCreate = async () => {
    if (!createName.trim()) return

    setIsCreating(true)
    try {
      const created = await categoryApi.save({
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        coverImageUrl: createCoverImageUrl || undefined,
      })
      setCategories((prev) => [...prev, created])
      setProductCounts((prev) => ({ ...prev, [created.id]: 0 }))
      resetCreateForm()
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
    setEditCoverImageUrl(cat.coverImageUrl || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditDesc("")
    setEditCoverImageUrl("")
  }

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return

    setIsSaving(true)
    try {
      const updated = await categoryApi.update(editingId, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        coverImageUrl: editCoverImageUrl || undefined,
      })
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
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Açıklama</label>
                  <Textarea
                    placeholder="Kısa açıklama (opsiyonel)"
                    rows={4}
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-dashed bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">Kapak Görseli</p>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {createCoverImageUrl ? (
                    <Image
                      src={resolveImageUrl(createCoverImageUrl)}
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
                    {isUploadingCreateCover ? (
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
                    disabled={!createCoverImageUrl}
                    onClick={() => setCreateCoverImageUrl("")}
                  >
                    Temizle
                  </Button>
                </div>
              </div>
            </div>

            <Button
              className="mt-2 w-full gap-2"
              disabled={isCreating || !createName.trim() || isUploadingCreateCover}
              onClick={handleCreate}
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isCreating ? "Oluşturuluyor..." : "Kategori Oluştur"}
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
                    {editingId === cat.id ? (
                      <>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="relative h-14 w-20 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={resolveImageUrl(editCoverImageUrl)}
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
                              {isUploadingEditCover ? "Yükleniyor..." : "Görsel değiştir"}
                            </label>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                        </TableCell>

                        <TableCell>
                          <Input
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
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
                              disabled={isSaving || !editName.trim() || isUploadingEditCover}
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
