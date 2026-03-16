"use client"

import { useState, useEffect } from "react"
import { FileText, Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { staticPageApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

interface StaticPage {
    id: number; title: string; slug: string; content: string; active: boolean; createdAt?: string; updatedAt?: string
}

export default function StaticPagesPage() {
    const [pages, setPages] = useState<StaticPage[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState<StaticPage | null>(null)
    const [form, setForm] = useState({ title: "", slug: "", content: "", active: true })

    useEffect(() => { load() }, [])

    const load = async () => {
        try { setPages(await staticPageApi.getAll()) }
        catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    const openEdit = (p: StaticPage) => {
        setEditItem(p)
        setForm({ title: p.title, slug: p.slug, content: p.content, active: p.active })
        setShowForm(true)
    }

    const openCreate = () => {
        setEditItem(null)
        setForm({ title: "", slug: "", content: "", active: true })
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!form.title || !form.content) { toast.error("Başlık ve içerik gerekli"); return }
        try {
            if (editItem) {
                await staticPageApi.update(editItem.id, form)
                toast.success("Sayfa güncellendi")
            } else {
                await staticPageApi.create(form)
                toast.success("Sayfa oluşturuldu")
            }
            setShowForm(false)
            await load()
        } catch { toast.error("İşlem başarısız") }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Sayfayı silmek istediğinize emin misiniz?")) return
        try { await staticPageApi.delete(id); toast.success("Silindi"); load() }
        catch { toast.error("Silinemedi") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Sayfa Yönetimi</h1>
                    <p className="text-muted-foreground">Statik sayfaları oluşturun ve düzenleyin</p>
                </div>
                <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Yeni Sayfa</Button>
            </div>

            {pages.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz sayfa eklenmemiş</CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {pages.map((p) => (
                        <Card key={p.id} className={!p.active ? "opacity-50" : ""}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{p.title}</p>
                                            <p className="text-xs text-muted-foreground font-mono">/{p.slug}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!p.active && <Badge variant="outline" className="text-xs">Pasif</Badge>}
                                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editItem ? "Sayfayı Düzenle" : "Yeni Sayfa Oluştur"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Başlık</label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Hakkımızda" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Slug (otomatik)</label>
                                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="hakkimizda" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">İçerik</label>
                            <Textarea rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Sayfa içeriğini yazın..." />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Aktif</label>
                            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">İptal</Button></DialogClose>
                        <Button onClick={handleSave}>{editItem ? "Güncelle" : "Oluştur"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
