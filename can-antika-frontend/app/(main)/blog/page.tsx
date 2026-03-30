import { cache, Suspense } from "react"
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
        timeoutMs: 1800,
    })
})

const fetchBlogCategories = cache(async () => {
    return fetchApiDataWithFallback<BlogCategory[]>("/v1/blog/categories", {
        revalidate: 300,
        timeoutMs: 1200,
    })
})

function BlogPostsLoading() {
    return (
        <div className="flex flex-col items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-muted-foreground animate-pulse">Yazılar yükleniyor...</p>
        </div>
    )
}

export default function BlogPage() {
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

                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Suspense fallback={<BlogPostsLoading />}>
                            <BlogPostsResolver />
                        </Suspense>
                    </div>
                </section>
            </main>
        </div>
    )
}

async function BlogPostsResolver() {
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
        <BlogPostsClient
            initialPosts={initialPosts}
            initialCategories={initialCategories}
        />
    )
}
