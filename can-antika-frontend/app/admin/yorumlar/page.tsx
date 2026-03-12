"use client"

import { useState, useEffect } from "react"
import { Star, Loader2, Trash2, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { reviewApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { formatDateTR } from "@/lib/utils"

interface Review { id: number; userId: number; userName: string; productId: number; productTitle: string; rating: number; comment: string; createdAt: string }

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Review | null>(null)

    useEffect(() => { load() }, [])

    const load = async () => {
        try {
            const data = await reviewApi.getAll()
            setReviews(Array.isArray(data) ? data : (data as any)?.items || [])
        } catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    const handleDelete = async (productId: number, reviewId: number) => {
        if (!confirm("Yorumu silmek istediğinize emin misiniz?")) return
        try { await reviewApi.delete(reviewId); toast.success("Silindi"); load() }
        catch { toast.error("Silinemedi") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-3 w-3 ${i <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />)}
        </div>
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">Ürün Yorumları</h1>
                <p className="text-muted-foreground">Müşteri yorumlarını yönetin</p>
            </div>

            {reviews.length === 0 ? (
                <Card><CardContent className="py-16 text-center"><Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Henüz yorum yok</p></CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {reviews.map((r) => (
                        <Card key={r.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {renderStars(r.rating)}
                                            <span className="text-sm font-semibold">{r.userName || "Anonim"}</span>
                                        </div>
                                        <p className="text-sm text-foreground line-clamp-2">{r.comment}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Ürün: {r.productTitle || `#${r.productId}`} · {r.createdAt ? formatDateTR(r.createdAt, "minimal") : ""}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => setSelected(r)}><Eye className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(r.productId, r.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Yorum Detayı</DialogTitle></DialogHeader>
                    {selected && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">{renderStars(selected.rating)}<span className="font-semibold">{selected.userName}</span></div>
                            <p className="text-sm whitespace-pre-wrap">{selected.comment}</p>
                            <p className="text-xs text-muted-foreground">Ürün: {selected.productTitle || `#${selected.productId}`}</p>
                            <p className="text-xs text-muted-foreground">{selected.createdAt ? new Date(selected.createdAt).toLocaleString("tr-TR") : ""}</p>
                        </div>
                    )}
                    <DialogClose asChild><Button variant="outline" className="w-full">Kapat</Button></DialogClose>
                </DialogContent>
            </Dialog>
        </div>
    )
}
