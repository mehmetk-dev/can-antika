import { cache } from "react"
import { BlogPostsClient } from "@/components/home/blog-posts-client"
import { PageHero } from "@/components/layout/page-hero"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import type { Metadata } from "next"
import Image from "next/image"
import type { BlogPost, BlogCategory, CursorResponse } from "@/lib/types"

export const revalidate = 60

export const metadata: Metadata = {
    title: "Blog",
    description: "Antika koleksiyonculuğu, restorasyon ipuçları ve tarihi eserler hakkında yazılarımız",
    alternates: {
        canonical: "/blog",
    },
    openGraph: {
        title: "Blog | Can Antika",
        description: "Antika koleksiyonculuğu, restorasyon ipuçları ve tarihi eserler hakkında yazılarımız",
        url: "/blog",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Blog | Can Antika",
        description: "Antika koleksiyonculuğu, restorasyon ipuçları ve tarihi eserler hakkında yazılarımız",
    },
}

const fetchBlogPosts = cache(async () => {
    return fetchApiDataWithFallback<CursorResponse<BlogPost>>("/v1/blog?page=0&size=50", {
        revalidate: 60,
        timeoutMs: 3500,
    })
})

const fetchBlogCategories = cache(async () => {
    return fetchApiDataWithFallback<BlogCategory[]>("/v1/blog/categories", {
        revalidate: 300,
        timeoutMs: 2500,
    })
})

export default async function BlogPage() {
    const [postsResult, categoriesResult] = await Promise.allSettled([
        fetchBlogPosts(),
        fetchBlogCategories(),
    ])

    const initialPosts = postsResult.status === "fulfilled" && postsResult.value
        ? Array.isArray(postsResult.value.items) ? postsResult.value.items : []
        : []

    const initialCategories = categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value)
        ? categoriesResult.value
        : []

    return (
        <div className="bg-background">
            <main>
                <PageHero
                    imageSrc="/blog-hero.png"
                    imageAlt="Blog"
                    eyebrow="Blog"
                    title="Antika Dünyası"
                    description="Antika koleksiyonculuğu, restorasyon ipuçları ve tarihi eserler hakkında yazılarımız"
                    priority
                />

                {/* Hero - Vintage Style */}
                {false && <section className="hidden">
                    {/* Background */}
                    <div className="absolute inset-0">
                        <Image src="/blog-hero.png" alt="Blog" fill priority sizes="100vw" className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/90 to-primary/95" />
                    </div>

                    {/* Decorative Frame */}
                    <div className="absolute top-8 left-8 right-8 bottom-8 border border-accent/20 pointer-events-none" />
                    <div className="absolute top-12 left-12 right-12 bottom-12 border border-accent/10 pointer-events-none" />

                    <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="w-16 h-px bg-accent/50" />
                            <div className="w-2 h-2 rotate-45 border border-accent/50" />
                            <div className="w-16 h-px bg-accent/50" />
                        </div>

                        <span className="inline-block font-serif text-accent text-lg tracking-widest uppercase mb-4">
                            Blog
                        </span>

                        <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary-foreground leading-tight">
                            Antika Dünyası
                        </h1>

                        <p className="mt-6 text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
                            Antika koleksiyonculuğu, restorasyon ipuçları ve tarihi eserler hakkında yazılarımız
                        </p>

                        <div className="flex items-center justify-center gap-4 mt-10">
                            <div className="w-24 h-px bg-accent/50" />
                            <div className="w-3 h-3 rotate-45 bg-accent/30" />
                            <div className="w-24 h-px bg-accent/50" />
                        </div>
                    </div>
                </section>}

                {/* Filters & Posts */}
                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <BlogPostsClient
                            initialPosts={initialPosts}
                            initialCategories={initialCategories}
                        />
                    </div>
                </section>
            </main>
        </div>
    )
}
