"use client"

import { useState, useEffect } from "react"
import { CreditCard, Loader2, Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { bankTransferApi } from "@/lib/api"

interface Transfer { id: number; orderId: number; userId: number; userName: string; userEmail: string; bankName: string; senderName: string; amount: number; receiptUrl: string; note: string; status: string; adminNote: string; createdAt: string }

const statusBadge: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Bekliyor", cls: "bg-amber-500/15 text-amber-700" },
    APPROVED: { label: "Onaylandı", cls: "bg-emerald-500/15 text-emerald-700" },
    REJECTED: { label: "Reddedildi", cls: "bg-red-500/15 text-red-700" },
}

export default function BankTransfersPage() {
    const [transfers, setTransfers] = useState<Transfer[]>([])
    const [loading, setLoading] = useState(true)
    const [pending, setPending] = useState(0)
    const [filter, setFilter] = useState("")

    useEffect(() => { load() }, [filter])

    const load = async () => {
        setLoading(true)
        try {
            const [data, cnt] = await Promise.all([bankTransferApi.getAll(0, 100, filter || undefined), bankTransferApi.getPendingCount()])
            setTransfers(data.items || [])
            setPending(cnt.count)
        } catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    const handleAction = async (id: number, status: string) => {
        const note = status === "REJECTED" ? prompt("Red nedeni (opsiyonel):") || "" : ""
        try {
            await bankTransferApi.update(id, { status, adminNote: note })
            toast.success(status === "APPROVED" ? "Onaylandı" : "Reddedildi")
            load()
        } catch { toast.error("İşlem başarısız") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Havale / EFT Bildirimleri</h1>
                    <p className="text-muted-foreground">Banka havalesi ile ödeme bildirimleri</p>
                </div>
                {pending > 0 && <Badge className="bg-amber-500 text-white text-sm">{pending} bekliyor</Badge>}
            </div>

            <div className="flex gap-2">
                <Button variant={filter === "" ? "default" : "outline"} size="sm" onClick={() => setFilter("")}>Tümü</Button>
                <Button variant={filter === "PENDING" ? "default" : "outline"} size="sm" onClick={() => setFilter("PENDING")}>Bekleyen</Button>
                <Button variant={filter === "APPROVED" ? "default" : "outline"} size="sm" onClick={() => setFilter("APPROVED")}>Onaylı</Button>
                <Button variant={filter === "REJECTED" ? "default" : "outline"} size="sm" onClick={() => setFilter("REJECTED")}>Reddedilen</Button>
            </div>

            {transfers.length === 0 ? (
                <Card><CardContent className="py-16 text-center"><CreditCard className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Bildirim yok</p></CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {transfers.map((t) => {
                        const badge = statusBadge[t.status] || { label: t.status, cls: "" }
                        return (
                            <Card key={t.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-semibold">Sipariş #{t.orderId}</p>
                                                <Badge className={badge.cls}>{badge.label}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{t.senderName} · {t.bankName} · ₺{Number(t.amount).toLocaleString("tr-TR")}</p>
                                            <p className="text-xs text-muted-foreground">{t.userName} ({t.userEmail}) · {t.createdAt ? new Date(t.createdAt).toLocaleString("tr-TR") : ""}</p>
                                            {t.note && <p className="text-xs text-muted-foreground mt-1 italic">Not: {t.note}</p>}
                                            {t.adminNote && <p className="text-xs text-amber-600 mt-0.5">Admin: {t.adminNote}</p>}
                                        </div>
                                        {t.status === "PENDING" && (
                                            <div className="flex gap-1 shrink-0">
                                                <Button size="sm" variant="outline" className="text-emerald-600 gap-1" onClick={() => handleAction(t.id, "APPROVED")}><Check className="h-3 w-3" /> Onayla</Button>
                                                <Button size="sm" variant="outline" className="text-red-600 gap-1" onClick={() => handleAction(t.id, "REJECTED")}><X className="h-3 w-3" /> Reddet</Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
