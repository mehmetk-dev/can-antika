"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { productApi, categoryApi } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"
import type { ProductResponse, CategoryResponse } from "@/lib/types"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const excelInputRef = useRef<HTMLInputElement>(null)
  const PAGE_SIZE = 20

  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch((e) => console.error("Kategori listesi alınamadı:", e))
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = { page, size: PAGE_SIZE }
      if (categoryFilter !== "all") params.categoryId = Number(categoryFilter)
      const data = await productApi.search(params as Parameters<typeof productApi.search>[0])
      setProducts(data.items)
      setTotalCount(data.totalElement)
    } catch {
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [page, categoryFilter])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return
    try {
      await productApi.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setTotalCount((prev) => prev - 1)
      toast.success("Ürün silindi")
    } catch {
      toast.error("Silme işlemi başarısız")
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Sadece .xlsx dosyası desteklenir")
      if (excelInputRef.current) excelInputRef.current.value = ""
      return
    }

    setIsImporting(true)
    try {
      const result = await productApi.importFromExcel(file)
      const preview = (result.errors || []).slice(0, 3).join(" | ")
      if (result.failedCount > 0) {
        toast.warning(`Aktarıldı: ${result.importedCount}, Hata: ${result.failedCount}${preview ? ` (${preview})` : ""}`)
      } else {
        toast.success(`${result.importedCount} ürün başarıyla aktarıldı`)
      }
      await loadProducts()
    } catch {
      toast.error("Excel aktarımı başarısız")
    } finally {
      setIsImporting(false)
      if (excelInputRef.current) excelInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Ürünler</h1>
          <p className="mt-1 text-muted-foreground">{totalCount} ürün kayıtlı</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={excelInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImportExcel} />
          <Button variant="outline" className="gap-2" onClick={() => excelInputRef.current?.click()} disabled={isImporting}>
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Excel'den Yükle
          </Button>
          <Link href="/admin/urunler/yeni">
            <Button className="gap-2 bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
              Yeni Ürün Ekle
            </Button>
          </Link>
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0) }}>
              <SelectTrigger className="w-full sm:w-40 bg-muted/50">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-16">Görsel</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead className="hidden md:table-cell">Kategori</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="border-border">
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={product.imageUrls?.[0] || "/placeholder.svg"}
                          alt={product.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground line-clamp-1">{product.title}</p>
                      <p className="text-xs text-muted-foreground">CAN-{product.id.toString().padStart(4, "0")}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {product.category?.name || "—"}
                    </TableCell>
                    <TableCell className="font-medium">₺{(product.price ?? 0).toLocaleString("tr-TR")}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          (product.stock ?? 0) > 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted-foreground text-muted"
                        }
                      >
                        {(product.stock ?? 0) > 0 ? `${product.stock} adet` : "Stokta Yok"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/urun/${product.slug ?? product.id}`}>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Görüntüle
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/admin/urunler/${product.id}/duzenle`}>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Önceki
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Sonraki
          </Button>
        </div>
      )}
    </div>
  )
}
