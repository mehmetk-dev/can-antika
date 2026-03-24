"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { periodApi } from "@/lib/api"
import type { PeriodResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminPeriodsPage() {
  const [periods, setPeriods] = useState<PeriodResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createActive, setCreateActive] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editActive, setEditActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    void loadPeriods()
  }, [])

  const activeCount = useMemo(() => periods.filter((item) => item.active !== false).length, [periods])

  const loadPeriods = async () => {
    setIsLoading(true)
    try {
      const data = await periodApi.getAll()
      setPeriods(data)
    } catch {
      setPeriods([])
      toast.error("Dönemler yüklenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  const resetCreateForm = () => {
    setCreateName("")
    setCreateActive(true)
  }

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open)
    if (!open) resetCreateForm()
  }

  const handleCreate = async () => {
    const name = createName.trim()
    if (!name) return

    setIsCreating(true)
    try {
      const created = await periodApi.save({ name, active: createActive })
      setPeriods((prev) => [...prev, created])
      setIsCreateOpen(false)
      resetCreateForm()
      toast.success("Dönem oluşturuldu")
    } catch {
      toast.error("Dönem oluşturulamadı")
    } finally {
      setIsCreating(false)
    }
  }

  const startEdit = (period: PeriodResponse) => {
    setEditingId(period.id)
    setEditName(period.name)
    setEditActive(period.active !== false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditActive(true)
  }

  const handleUpdate = async () => {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return

    setIsSaving(true)
    try {
      const updated = await periodApi.update(editingId, { name, active: editActive })
      setPeriods((prev) => prev.map((item) => (item.id === editingId ? updated : item)))
      cancelEdit()
      toast.success("Dönem güncellendi")
    } catch {
      toast.error("Dönem güncellenemedi")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu dönemi silmek istediğinize emin misiniz?")) return

    try {
      await periodApi.delete(id)
      setPeriods((prev) => prev.filter((item) => item.id !== id))
      toast.success("Dönem silindi")
    } catch {
      toast.error("Dönem silinemedi")
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
          <h1 className="font-serif text-2xl font-bold text-foreground">Dönemler</h1>
          <p className="text-muted-foreground">Ürün dönemlerini yönetin</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Dönem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Dönem</DialogTitle>
              <DialogDescription>Ürün formunda seçilecek yeni bir dönem oluşturun.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Dönem Adı</label>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Örn. Osmanlı Dönemi"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={createActive}
                  onChange={(e) => setCreateActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Aktif
              </label>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !createName.trim()}
                className="w-full gap-2"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isCreating ? "Oluşturuluyor..." : "Dönem Oluştur"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Toplam Dönem</p>
            <p className="text-2xl font-bold text-foreground">{periods.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aktif Dönem</p>
            <p className="text-2xl font-bold text-primary">{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <CalendarClock className="h-5 w-5" /> Dönem Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">Henüz dönem eklenmemiş</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem Adı</TableHead>
                  <TableHead className="w-28 text-center">Durum</TableHead>
                  <TableHead className="w-[170px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((item) => (
                  <TableRow key={item.id}>
                    {editingId === item.id ? (
                      <>
                        <TableCell>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                        </TableCell>
                        <TableCell className="text-center">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                              className="h-4 w-4 rounded border-input"
                            />
                            Aktif
                          </label>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={
                              item.active === false
                                ? "inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                                : "inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                            }
                          >
                            {item.active === false ? "Pasif" : "Aktif"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => startEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(item.id)}
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
