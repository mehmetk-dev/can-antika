"use client"

import { useState, useEffect } from "react"
import { Monitor, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { popupApi } from "@/lib/api"
import type { PopupResponse } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

interface PopupItem { id: number; title: string; content: string; imageUrl: string; linkUrl: string; linkText: string; active: boolean; position: string; delaySeconds: number; showOnce: boolean }

function toPopupItem(popup: PopupResponse): PopupItem {
    return {
        id: popup.id,
        title: popup.title,
        content: popup.content,
        imageUrl: popup.imageUrl || "",
        linkUrl: popup.linkUrl || "",
        linkText: "",
        active: popup.active,
        position: "CENTER",
        delaySeconds: 3,
        showOnce: true,
    }
}

export default function PopupsPage() {
    const [popups, setPopups] = useState<PopupItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState<PopupItem | null>(null)
    const [form, setForm] = useState({ title: "", content: "", imageUrl: "", linkUrl: "", linkText: "", active: false, position: "CENTER", delaySeconds: 3, showOnce: true })

    useEffect(() => { load() }, [])

    const load = async () => {
        try {
            const data = await popupApi.getAll()
            setPopups(data.map(toPopupItem))
        }
        catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    const openCreate = () => { setEditItem(null); setForm({ title: "", content: "", imageUrl: "", linkUrl: "", linkText: "", active: false, position: "CENTER", delaySeconds: 3, showOnce: true }); setShowForm(true) }
    const openEdit = (p: PopupItem) => { setEditItem(p); setForm({ title: p.title, content: p.content || "", imageUrl: p.imageUrl || "", linkUrl: p.linkUrl || "", linkText: p.linkText || "", active: p.active, position: p.position, delaySeconds: p.delaySeconds, showOnce: p.showOnce }); setShowForm(true) }

    const handleSave = async () => {
        if (!form.title) { toast.error("Başlık gerekli"); return }
        try {
            if (editItem) { await popupApi.update(editItem.id, form); toast.success("Güncellendi") }
            else { await popupApi.create(form); toast.success("Oluşturuldu") }
            setShowForm(false); load()
        } catch { toast.error("Başarısız") }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return
        try { await popupApi.delete(id); toast.success("Silindi"); load() }
        catch { toast.error("Silinemedi") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Popup Yönetimi</h1>
                    <p className="text-muted-foreground">Site popup’larını oluşturun ve yönetin</p>
                </div>
                <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Yeni Popup</Button>
            </div>

            {popups.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz popup yok</CardContent></Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {popups.map((p) => (
                        <Card key={p.id} className={!p.active ? "opacity-50" : ""}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Monitor className="h-4 w-4 text-primary shrink-0" />
                                            <p className="font-semibold truncate">{p.title}</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap mt-1">
                                            <Badge variant={p.active ? "default" : "outline"}>{p.active ? "Aktif" : "Pasif"}</Badge>
                                            <Badge variant="outline">{p.position}</Badge>
                                            <Badge variant="outline">{p.delaySeconds}sn gecikme</Badge>
                                            {p.showOnce && <Badge variant="outline">Tek gösterim</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
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
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editItem ? "Popup Düzenle" : "Yeni Popup"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1"><label className="text-sm font-medium">Başlık</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium">İçerik</label><Textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><label className="text-sm font-medium">Görsel URL</label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Link URL</label><Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1"><label className="text-sm font-medium">Buton Yazısı</label><Input value={form.linkText} onChange={(e) => setForm({ ...form, linkText: e.target.value })} placeholder="İncele" /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Pozisyon</label>
                                <select className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                                    <option value="CENTER">Orta</option>
                                    <option value="BOTTOM">Alt</option>
                                    <option value="TOP">Üst</option>
                                </select>
                            </div>
                            <div className="space-y-1"><label className="text-sm font-medium">Gecikme (sn)</label><Input type="number" value={form.delaySeconds} onChange={(e) => setForm({ ...form, delaySeconds: Number(e.target.value) })} /></div>
                        </div>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktif</label>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showOnce} onChange={(e) => setForm({ ...form, showOnce: e.target.checked })} /> Tek gösterim</label>
                        </div>
                    </div>
                    <DialogFooter><DialogClose asChild><Button variant="outline">İptal</Button></DialogClose><Button onClick={handleSave}>{editItem ? "Güncelle" : "Oluştur"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
