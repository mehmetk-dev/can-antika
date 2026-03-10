"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Calendar, User, ArrowLeft, Loader2, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { blogApi } from "@/lib/api"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "dompurify"
import type { BlogPost, BlogCategory } from "@/lib/types"

interface BlogDetailClientProps {
    initialPost: BlogPost | null
}

export function BlogDetailClient({ initialPost }: BlogDetailClientProps) {
    const [post, setPost] = useState<BlogPost | null>(initialPost)
    const [categories, setCategories] = useState<BlogCategory[]>([])
    const [loading, setLoading] = useState(!initialPost)

    useEffect(() => {
        blogApi.getCategories().then(setCategories).catch(() => setCategories([]))
        if (!initialPost) setLoading(false)
    }, [initialPost])

    const getCategoryName = (id: number) =>
        categories.find((c) => c.id === id)?.name || ""

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })
        } catch {
            return ""
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <Footer />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                    <Tag className="h-16 w-16 text-muted-foreground/40 mb-6" />
                    <h1 className="font-serif text-3xl font-bold text-foreground">Yazı Bulunamadı</h1>
                    <p className="mt-3 text-muted-foreground max-w-md">
                        Aradığınız blog yazısı bulunamadı veya kaldırılmış olabilir.
                    </p>
                    <Link
                        href="/blog"
                        className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Blog&apos;a Dön
                    </Link>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                {/* Hero Image */}
                {post.imageUrl && (
                    <section className="relative h-[400px] md:h-[500px] overflow-hidden">
                        <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    </section>
                )}

                {/* Article Content */}
                <article className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
                    {/* Back Link */}
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
                        id="blog-detail-back"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Blog&apos;a Dön
                    </Link>

                    {/* Category */}
                    {getCategoryName(post.categoryId) && (
                        <Badge variant="outline" className="mb-4">
                            {getCategoryName(post.categoryId)}
                        </Badge>
                    )}

                    {/* Title */}
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight">
                        {post.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
                        {post.author && (
                            <span className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                {post.author}
                            </span>
                        )}
                        {post.createdAt && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {formatDate(post.createdAt)}
                            </span>
                        )}
                    </div>

                    {/* Summary */}
                    {post.summary && (
                        <p className="mt-8 text-lg text-muted-foreground leading-relaxed border-l-4 border-accent/30 pl-6 italic">
                            {post.summary}
                        </p>
                    )}

                    {/* Divider */}
                    <div className="flex items-center justify-center gap-4 my-10">
                        <div className="w-16 h-px bg-border" />
                        <div className="w-2 h-2 rotate-45 border border-border" />
                        <div className="w-16 h-px bg-border" />
                    </div>

                    {/* Content */}
                    <div
                        className="prose prose-lg max-w-none
                            prose-headings:font-serif prose-headings:text-foreground
                            prose-p:text-muted-foreground prose-p:leading-relaxed
                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                            prose-strong:text-foreground
                            prose-img:rounded-xl prose-img:shadow-lg"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                    />

                    {/* Bottom CTA */}
                    <div className="mt-16 p-8 bg-muted/30 rounded-xl border border-border/50 text-center">
                        <h3 className="font-serif text-xl font-semibold text-foreground">
                            Koleksiyonumuza Göz Atın
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                            Yazılarımızda bahsettiğimiz eserler ve daha fazlası mağazamızda sizleri bekliyor.
                        </p>
                        <Link
                            href="/urunler"
                            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            Ürünleri İncele
                        </Link>
                    </div>
                </article>
            </main>
            <Footer />
        </div>
    )
}
