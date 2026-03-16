"use client"

import { useState, useEffect } from "react"
import { HelpCircle, Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { faqApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

interface FaqItem {
    id: number; question: string; answer: string; displayOrder: number; active: boolean
}

export default function FaqPage() {
    const [faqs, setFaqs] = useState<FaqItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState<FaqItem | null>(null)
    const [form, setForm] = useState({ question: "", answer: "", displayOrder: 0, active: true })

    useEffect(() => { load() }, [])

    const load = async () => {
        try { setFaqs(await faqApi.getAll()) }
        catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    const openEdit = (f: FaqItem) => {
        setEditItem(f)
        setForm({ question: f.question, answer: f.answer, displayOrder: f.displayOrder, active: f.active })
        setShowForm(true)
    }

    const openCreate = () => {
        setEditItem(null)
        setForm({ question: "", answer: "", displayOrder: faqs.length, active: true })
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!form.question || !form.answer) { toast.error("Soru ve cevap gerekli"); return }
        try {
            if (editItem) {
                await faqApi.update(editItem.id, form)
                toast.success("SSS güncellendi")
            } else {
                await faqApi.create(form)
                toast.success("SSS eklendi")
            }
            setShowForm(false)
            await load()
        } catch { toast.error("İşlem başarısız") }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return
        try { await faqApi.delete(id); toast.success("Silindi"); load() }
        catch { toast.error("Silinemedi") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Sıkça Sorulan Sorular</h1>
                    <p className="text-muted-foreground">SSS içeriklerini yönetin</p>
                </div>
                <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Yeni SSS</Button>
            </div>

            {faqs.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz SSS eklenmemiş</CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {[...faqs].sort((a, b) => a.displayOrder - b.displayOrder).map((f) => (
                        <Card key={f.id} className={!f.active ? "opacity-50" : ""}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                                            <p className="text-sm font-semibold text-foreground">{f.question}</p>
                                            {!f.active && <Badge variant="outline" className="text-xs">Pasif</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-6 line-clamp-2">{f.answer}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editItem ? "SSS Düzenle" : "Yeni SSS Ekle"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Soru</label>
                            <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Kargo ne kadar sürer?" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Cevap</label>
                            <Textarea rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Standart kargomuz..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Sıralama</label>
                                <Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1 flex items-end gap-2 pb-0.5">
                                <label className="text-sm font-medium">Aktif</label>
                                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                            </div>
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
