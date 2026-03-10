"use client"

import { useState, useEffect } from "react"
import { Mail, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { newsletterApi } from "@/lib/api"
import type { NewsletterSubscriber } from "@/lib/types"

interface Subscriber {
    id: number; email: string; name?: string; active: boolean; subscribedAt: string
}

function toSubscriber(item: NewsletterSubscriber): Subscriber {
    return {
        id: item.id,
        email: item.email,
        name: item.name,
        active: true,
        subscribedAt: item.subscribedAt,
    }
}

export default function NewsletterPage() {
    const [subs, setSubs] = useState<Subscriber[]>([])
    const [count, setCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => { load() }, [])

    const load = async () => {
        try {
            const [data, c] = await Promise.all([newsletterApi.getAll(0, 100), newsletterApi.getCount()])
            setSubs((data.items || []).map(toSubscriber))
            setCount(c.count)
        } catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Aboneyi silmek istediğinize emin misiniz?")) return
        try { await newsletterApi.delete(id); toast.success("Silindi"); load() }
        catch { toast.error("Silinemedi") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">Bülten Aboneleri</h1>
                <p className="text-muted-foreground">Newsletter aboneliklerini yönetin</p>
            </div>

            <Card>
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold font-serif">{count}</p>
                        <p className="text-sm text-muted-foreground">Aktif Abone</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-serif">Aboneler</CardTitle>
                    <CardDescription>Toplam {subs.length} kayıt</CardDescription>
                </CardHeader>
                <CardContent>
                    {subs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Henüz abone yok</p>
                    ) : (
                        <div className="space-y-2">
                            {subs.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{sub.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {sub.name || "—"} · {new Date(sub.subscribedAt).toLocaleDateString("tr-TR")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant={sub.active ? "default" : "outline"}>{sub.active ? "Aktif" : "Pasif"}</Badge>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(sub.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
