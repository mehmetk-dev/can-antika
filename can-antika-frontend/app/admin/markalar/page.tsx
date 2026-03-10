"use client"

import { useState, useEffect } from "react"
import { Tag, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { brandApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

interface Brand { id: number; name: string; slug: string; logoUrl: string; active: boolean }

export default function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState<Brand | null>(null)
    const [form, setForm] = useState({ name: "", slug: "", logoUrl: "", active: true })

    useEffect(() => { load() }, [])

    const load = async () => {
        try { setBrands(await brandApi.getAll()) }
        catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    const openCreate = () => { setEditItem(null); setForm({ name: "", slug: "", logoUrl: "", active: true }); setShowForm(true) }
    const openEdit = (b: Brand) => { setEditItem(b); setForm({ name: b.name, slug: b.slug, logoUrl: b.logoUrl || "", active: b.active }); setShowForm(true) }

    const handleSave = async () => {
        if (!form.name) { toast.error("Marka adı gerekli"); return }
        try {
            if (editItem) { await brandApi.update(editItem.id, form); toast.success("Güncellendi") }
            else { await brandApi.create(form); toast.success("Eklendi") }
            setShowForm(false); load()
        } catch { toast.error("İşlem başarısız") }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return
        try { await brandApi.delete(id); toast.success("Silindi"); load() }
        catch { toast.error("Silinemedi") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Markalar</h1>
                    <p className="text-muted-foreground">Ürün markalarını yönetin</p>
                </div>
                <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Yeni Marka</Button>
            </div>

            {brands.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz marka eklenmemiş</CardContent></Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {brands.map((b) => (
                        <Card key={b.id} className={!b.active ? "opacity-50" : ""}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    {b.logoUrl ? (
                                        <img src={b.logoUrl} alt={b.name} className="h-12 w-12 rounded-lg object-contain border bg-white" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Tag className="h-5 w-5 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{b.name}</p>
                                        {b.slug && <p className="text-xs text-muted-foreground font-mono">/{b.slug}</p>}
                                        {!b.active && <Badge variant="outline" className="text-xs mt-1">Pasif</Badge>}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editItem ? "Marka Düzenle" : "Yeni Marka"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1"><label className="text-sm font-medium">Marka Adı</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-1"><label className="text-sm font-medium">Slug</label>
                            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="otomatik" />
                        </div>
                        <div className="space-y-1"><label className="text-sm font-medium">Logo URL</label>
                            <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Aktif</label>
                            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">İptal</Button></DialogClose>
                        <Button onClick={handleSave}>{editItem ? "Güncelle" : "Ekle"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
