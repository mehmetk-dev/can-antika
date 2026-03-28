"use client"

import { useState, useEffect } from "react"
import { Ticket, Plus, Pencil, Trash2, Loader2, Calendar, Percent, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { couponApi } from "@/lib/api"
import { formatDateTR } from "@/lib/utils"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog"

interface Coupon {
    id: number
    code: string
    discountAmount: number
    discountType: "FIXED" | "PERCENTAGE"
    minCartAmount?: number
    maxUsageCount: number
    currentUsageCount: number
    perUserLimit: number
    description?: string
    isActive: boolean
    expirationDate: string
    createdAt?: string
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)
    const [showCreate, setShowCreate] = useState(false)

    const [form, setForm] = useState({
        code: "", discount: "", type: "FIXED" as "FIXED" | "PERCENTAGE",
        minAmount: "", days: "30", maxUsage: "0", perUser: "1", description: "",
    })

    useEffect(() => {
        loadCoupons()
    }, [])

    const loadCoupons = async () => {
        try {
            const data = await couponApi.getAll()
            setCoupons(data as unknown as Coupon[])
        } catch { toast.error("Kuponlar yüklenemedi") }
        finally { setLoading(false) }
    }

    const handleCreate = async () => {
        if (!form.code || !form.discount) { toast.error("Kod ve indirim gerekli"); return }
        try {
            await couponApi.create(form.code, Number(form.discount), form.minAmount ? Number(form.minAmount) : undefined, Number(form.days))
            toast.success("Kupon oluşturuldu")
            setShowCreate(false)
            setForm({ code: "", discount: "", type: "FIXED", minAmount: "", days: "30", maxUsage: "0", perUser: "1", description: "" })
            loadCoupons()
        } catch (e) { toast.error(e instanceof Error ? e.message : "Oluşturulamadı") }
    }

    const handleUpdate = async () => {
        if (!editCoupon) return
        try {
            await couponApi.update(editCoupon.id, editCoupon)
            toast.success("Kupon güncellendi")
            setEditCoupon(null)
            loadCoupons()
        } catch { toast.error("Güncelleme başarısız") }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Kuponu silmek istediğinize emin misiniz?")) return
        try {
            await couponApi.delete(id)
            toast.success("Kupon silindi")
            loadCoupons()
        } catch { toast.error("Silinemedi") }
    }

    if (loading) {
        return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Kuponlar</h1>
                    <p className="text-muted-foreground">İndirim kuponlarını yönetin</p>
                </div>
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Kupon</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Yeni Kupon Oluştur</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Kupon Kodu</label>
                                    <Input placeholder="YENI2024" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">İndirim</label>
                                    <Input type="number" placeholder="10" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Min. Sepet (₺)</label>
                                    <Input type="number" placeholder="100" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Geçerlilik (gün)</label>
                                    <Input type="number" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">İptal</Button></DialogClose>
                            <Button onClick={handleCreate}>Oluştur</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Coupon List */}
            <div className="grid gap-3">
                {coupons.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz kupon yok</CardContent></Card>
                ) : coupons.map((c) => {
                    const isExpired = new Date(c.expirationDate) < new Date()
                    return (
                        <Card key={c.id} className={`${!c.isActive || isExpired ? "opacity-60" : ""}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                                            {c.discountType === "PERCENTAGE" ? <Percent className="h-5 w-5 text-primary" /> : <DollarSign className="h-5 w-5 text-primary" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-lg font-bold text-foreground">{c.code}</span>
                                                {!c.isActive && <Badge variant="outline" className="text-xs">Pasif</Badge>}
                                                {isExpired && <Badge variant="destructive" className="text-xs">Süresi Dolmuş</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {c.discountType === "PERCENTAGE" ? `%${c.discountAmount}` : `₺${c.discountAmount}`} indirim
                                                {c.minCartAmount ? ` • Min ₺${c.minCartAmount}` : ""}
                                                {" • "}{c.currentUsageCount}/{c.maxUsageCount || "∞"} kullanım
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-xs text-muted-foreground mr-2 hidden sm:block">
                                            <Calendar className="h-3 w-3 inline mr-1" />
                                            {formatDateTR(c.expirationDate, "minimal")}
                                        </span>
                                        <Button size="icon" variant="ghost" onClick={() => setEditCoupon({ ...c })}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editCoupon} onOpenChange={(o) => !o && setEditCoupon(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Kuponu Düzenle</DialogTitle></DialogHeader>
                    {editCoupon && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Kod</label>
                                    <Input value={editCoupon.code} onChange={(e) => setEditCoupon({ ...editCoupon, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">İndirim</label>
                                    <Input type="number" value={editCoupon.discountAmount} onChange={(e) => setEditCoupon({ ...editCoupon, discountAmount: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Tip</label>
                                    <select className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={editCoupon.discountType} onChange={(e) => setEditCoupon({ ...editCoupon, discountType: e.target.value as "FIXED" | "PERCENTAGE" })}>
                                        <option value="FIXED">Sabit (₺)</option>
                                        <option value="PERCENTAGE">Yüzde (%)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Min. Sepet</label>
                                    <Input type="number" value={editCoupon.minCartAmount || ""} onChange={(e) => setEditCoupon({ ...editCoupon, minCartAmount: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Max Kullanım (0=sınırsız)</label>
                                    <Input type="number" value={editCoupon.maxUsageCount} onChange={(e) => setEditCoupon({ ...editCoupon, maxUsageCount: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Kişi Başı Limit</label>
                                    <Input type="number" value={editCoupon.perUserLimit} onChange={(e) => setEditCoupon({ ...editCoupon, perUserLimit: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium">Aktif</label>
                                <input type="checkbox" checked={editCoupon.isActive} onChange={(e) => setEditCoupon({ ...editCoupon, isActive: e.target.checked })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">İptal</Button></DialogClose>
                        <Button onClick={handleUpdate}>Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
