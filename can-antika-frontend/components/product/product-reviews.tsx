"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"
import { reviewApi } from "@/lib/api"
import type { ReviewResponse } from "@/lib/types"
import { formatDateTR, getErrorMessage } from "@/lib/utils"

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
                if (!isCancelled) {
                    setReviews([])
                }
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
            toast.error(getErrorMessage(err, "Yorum eklenemedi"))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#d4af37]" />
            </div>
        )
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-start justify-start text-left max-w-[420px] py-4 space-y-4">
                <div className="space-y-1">
                    <p className="font-serif text-lg font-normal text-primary/70">Henüz Değerlendirme Yok</p>
                    <p className="font-light text-xs text-muted-foreground">Bu nadide eser hakkında ilk yorumu siz bırakın.</p>
                </div>

                <div className="w-full">
                    {isAuthenticated ? (
                        <div className="space-y-4 rounded-xl border border-border bg-transparent p-4 text-left">
                            <h4 className="font-serif text-base tracking-wide text-[#5c4a3d]">Değerlendirmenizi Bırakın</h4>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button key={s} type="button" onClick={() => setRating(s)} className="p-0.5 transition-transform hover:scale-110" aria-label={`${s} yıldız`}>
                                        <Star className={`h-4.5 w-4.5 transition-colors ${s <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30 hover:text-amber-300"}`} />
                                    </button>
                                ))}
                            </div>
                            <Textarea
                                placeholder="Bu eşsiz eser hakkındaki düşüncelerinizi kelimelere dökün..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                                maxLength={1000}
                                className="resize-none text-xs font-light bg-transparent border-border/60 focus:border-[#d4af37] transition-colors"
                            />
                            <Button onClick={handleSubmit} disabled={submitting} className="h-9 px-5 rounded-none bg-[#4a3424] text-white font-serif tracking-widest hover:bg-[#362519] transition-all uppercase text-xs">
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Gönder
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full rounded-xl border border-[#d4af37]/20 bg-[#fbf9f6] p-5 text-left flex flex-col items-start justify-start gap-2">
                            <p className="text-muted-foreground font-light text-xs">
                                Bu nadide eser hakkında görüşlerinizi paylaşmak için <Link href="/giris" className="text-[#6f4c1f] font-medium transition-all hover:text-[#d4af37] hover:underline">giriş yapın</Link>.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.85fr)] lg:items-start lg:gap-8">
            <div className="space-y-5">
            {/* Average */}
            <div className="flex items-center gap-4">
                <div className="text-center">
                    <p className="font-serif text-3xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                    <div className="flex gap-0.5 mt-0.5 justify-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(avgRating) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{reviews.length} yorum</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="flex-1 space-y-0.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingCounts[star as 1 | 2 | 3 | 4 | 5]
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                        return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                                <span className="w-2.5 text-muted-foreground">{star}</span>
                                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-5 text-right text-muted-foreground">{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <Separator />

            {/* Write review */}
            {isAuthenticated ? (
                <div className="space-y-4 rounded-xl border border-border bg-transparent p-4 sm:p-5">
                    <h4 className="font-serif text-lg tracking-wide text-[#5c4a3d]">Değerlendirmenizi Bırakın</h4>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} type="button" onClick={() => setRating(s)} className="p-0.5 transition-transform hover:scale-110" aria-label={`${s} yıldız`}>
                                <Star className={`h-5 w-5 transition-colors ${s <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30 hover:text-amber-300"}`} />
                            </button>
                        ))}
                    </div>
                    <Textarea
                        placeholder="Bu eşsiz eser hakkındaki düşüncelerinizi kelimelere dökün..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        className="resize-none text-sm font-light bg-transparent border-border/60 focus:border-[#d4af37] transition-colors"
                    />
                    <Button onClick={handleSubmit} disabled={submitting} className="h-10 px-6 rounded-none bg-[#4a3424] text-white font-serif tracking-widest hover:bg-[#362519] transition-all uppercase text-xs">
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Gönder
                    </Button>
                </div>
            ) : (
                <div className="rounded-xl border border-[#d4af37]/20 bg-[#fbf9f6] p-5 text-center flex flex-col items-center justify-center gap-2">
                    <p className="text-muted-foreground font-light text-xs">
                      Bu nadide eser hakkında görüşlerinizi paylaşmak için <Link href="/giris" className="text-[#6f4c1f] font-medium transition-all hover:text-[#d4af37] hover:underline">giriş yapın</Link>.
                    </p>
                </div>
            )}
            </div>

            <div className="min-h-[180px]">
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
            </div>
        </div>
    )
}
