"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { reviewApi } from "@/lib/api"
import type { ReviewResponse } from "@/lib/types"
import { formatDateTR } from "@/lib/utils"

interface ProductReviewsProps {
    productId: number
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const { isAuthenticated, user } = useAuth()
    const [reviews, setReviews] = useState<ReviewResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        let isCancelled = false
        reviewApi.getByProductId(productId)
            .then((response) => {
                if (!isCancelled) setReviews(response)
            })
            .catch(() => {
                if (!isCancelled) setReviews([])
            })
            .finally(() => {
                if (!isCancelled) setLoading(false)
            })

        return () => {
            isCancelled = true
        }
    }, [productId])

    const { avgRating, ratingCounts } = useMemo(() => {
        if (reviews.length === 0) {
            return { avgRating: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
        }

        let total = 0
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

        for (const review of reviews) {
            const normalized = Math.min(5, Math.max(1, review.rating)) as 1 | 2 | 3 | 4 | 5
            total += normalized
            counts[normalized] += 1
        }

        return { avgRating: total / reviews.length, ratingCounts: counts }
    }, [reviews])

    const handleSubmit = async () => {
        if (!user) return
        if (!comment.trim()) { toast.error("Lütfen bir yorum yazın"); return }
        setSubmitting(true)
        try {
            const newReview = await reviewApi.save({ productId, userId: user.id, rating, comment })
            setReviews((prev) => [newReview, ...prev])
            setComment("")
            setRating(5)
            toast.success("Yorumunuz eklendi")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Yorum eklenemedi")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-3xl space-y-8">
            {/* Average */}
            <div className="flex items-center gap-6">
                <div className="text-center">
                    <p className="font-serif text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                    <div className="flex gap-0.5 mt-1 justify-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{reviews.length} yorum</p>
                </div>
                <Separator orientation="vertical" className="h-16" />
                <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingCounts[star as 1 | 2 | 3 | 4 | 5]
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                        return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                                <span className="w-3 text-muted-foreground">{star}</span>
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-6 text-right text-muted-foreground">{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <Separator />

            {/* Write review */}
            {isAuthenticated ? (
                <div className="space-y-4 rounded-lg border border-border bg-card p-6">
                    <h4 className="font-serif font-semibold text-foreground">Yorum Yaz</h4>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} type="button" onClick={() => setRating(s)} className="p-0.5" aria-label={`${s} yıldız`}>
                                <Star className={`h-6 w-6 transition-colors ${s <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30 hover:text-amber-300"}`} />
                            </button>
                        ))}
                    </div>
                    <Textarea
                        placeholder="Bu ürün hakkında düşüncelerinizi paylaşın..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="resize-none"
                    />
                    <Button onClick={handleSubmit} disabled={submitting} size="sm">
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Gönder
                    </Button>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
                    <p className="text-muted-foreground">Yorum yapmak için <Link href="/giris" className="text-primary hover:underline">giriş yapın</Link>.</p>
                </div>
            )}

            {/* Review list */}
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="rounded-lg border border-border bg-card p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-serif font-semibold text-primary">
                                        {review.user?.name?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground text-sm">{review.user?.name || "Anonim"}</p>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {formatDateTR(review.createdAt, "minimal")}
                                </span>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
