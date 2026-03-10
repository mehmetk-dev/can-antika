import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogPostsClient } from "@/components/blog-posts-client"
import type { Metadata } from "next"

import { getServerApiUrl } from "@/lib/server-api-url"
const API_URL = getServerApiUrl()

export const revalidate = 300 // ISR: 5 dakikada bir yenile (AUDIT M7)

export const metadata: Metadata = {
    title: "Blog | Antika Dünyası",
    description: "Antika koleksiyonculuğu, restorasyon ipuçları ve tarihi eserler hakkında yazılarımız",
}

async function fetchBlogData() {
    try {
        const [postsRes, catsRes] = await Promise.all([
            fetch(`${API_URL}/v1/blog?page=0&size=50`, { next: { revalidate: 300 } }),
            fetch(`${API_URL}/v1/blog/categories`, { next: { revalidate: 300 } }),
        ])

        const postsJson = postsRes.ok ? await postsRes.json() : null
        const catsJson = catsRes.ok ? await catsRes.json() : null

        return {
            posts: postsJson?.data?.items || [],
            categories: catsJson?.data || [],
        }
    } catch {
        return { posts: [], categories: [] }
    }
}

export default async function BlogPage() {
    const { posts, categories } = await fetchBlogData()

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                {/* Hero */}
                <section className="relative py-28 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/95 to-primary/90" />
                    <div className="absolute top-8 left-8 right-8 bottom-8 border border-accent/20 pointer-events-none" />

                    <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
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
                </section>

                {/* Filters & Posts */}
                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <BlogPostsClient posts={posts} categories={categories} />
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
