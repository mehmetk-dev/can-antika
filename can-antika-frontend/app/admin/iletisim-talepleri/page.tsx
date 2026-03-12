"use client"

import { useState, useEffect } from "react"
import { Inbox, Loader2, Trash2, Eye, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { contactApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

interface ContactReq { id: number; name: string; email: string; phone: string; subject: string; message: string; read: boolean; adminNote: string; createdAt: string }

export default function ContactRequestsPage() {
    const [requests, setRequests] = useState<ContactReq[]>([])
    const [loading, setLoading] = useState(true)
    const [unread, setUnread] = useState(0)
    const [selected, setSelected] = useState<ContactReq | null>(null)
    const [note, setNote] = useState("")

    useEffect(() => { load() }, [])

    const load = async () => {
        try {
            const [data, countData] = await Promise.all([contactApi.getAll(0, 100), contactApi.getUnreadCount()])
            setRequests((data.items as unknown as ContactReq[]) || [])
            setUnread(countData.count)
        } catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    const openDetail = async (req: ContactReq) => {
        setSelected(req)
        setNote(req.adminNote || "")
        if (!req.read) {
            try { await contactApi.update(req.id, { read: true }); load() } catch { }
        }
    }

    const saveNote = async () => {
        if (!selected) return
        try { await contactApi.update(selected.id, { read: true, adminNote: note }); toast.success("Not kaydedildi"); setSelected(null); load() }
        catch { toast.error("Başarısız") }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return
        try { await contactApi.delete(id); toast.success("Silindi"); load() }
        catch { toast.error("Silinemedi") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">İletişim Talepleri</h1>
                    <p className="text-muted-foreground">Web sitesi iletişim formundan gelen mesajlar</p>
                </div>
                {unread > 0 && <Badge className="bg-red-500 text-white text-sm">{unread} okunmamış</Badge>}
            </div>

            {requests.length === 0 ? (
                <Card><CardContent className="py-16 text-center"><Inbox className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Henüz iletişim talebi yok</p></CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {requests.map((r) => (
                        <Card key={r.id} className={!r.read ? "border-primary/30 bg-primary/5" : ""}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <button className="flex-1 text-left min-w-0" onClick={() => openDetail(r)}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {!r.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                                            <p className="text-sm font-semibold truncate">{r.subject || "(Konu yok)"}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{r.name} · {r.email}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{r.createdAt ? new Date(r.createdAt).toLocaleString("tr-TR") : ""}</p>
                                    </button>
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => openDetail(r)}><Eye className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>İletişim Talebi</DialogTitle></DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-muted-foreground">Ad:</span><p className="font-medium">{selected.name}</p></div>
                                <div><span className="text-muted-foreground">E-posta:</span><p className="font-medium">{selected.email}</p></div>
                                {selected.phone && <div><span className="text-muted-foreground">Telefon:</span><p className="font-medium">{selected.phone}</p></div>}
                                <div><span className="text-muted-foreground">Tarih:</span><p>{new Date(selected.createdAt).toLocaleString("tr-TR")}</p></div>
                            </div>
                            <div><span className="text-sm text-muted-foreground">Konu:</span><p className="font-medium">{selected.subject}</p></div>
                            <div className="bg-muted/50 rounded-lg p-3"><p className="text-sm whitespace-pre-wrap">{selected.message}</p></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Admin Notu</label><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="İç not ekleyin..." /></div>
                        </div>
                    )}
                    <DialogFooter><DialogClose asChild><Button variant="outline">Kapat</Button></DialogClose><Button onClick={saveNote}>Notu Kaydet</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
