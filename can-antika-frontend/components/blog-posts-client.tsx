"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Calendar, User, ArrowRight, Search, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDateTR } from "@/lib/utils"
import { blogApi } from "@/lib/api"

interface BlogPost {
    id: number
    title: string
    slug: string
    summary: string
    content: string
    imageUrl: string
    categoryId: number
    author: string
    published: boolean
    createdAt: string
}

interface BlogCategory {
    id: number
    name: string
    slug: string
    active: boolean
}

interface BlogPostsClientProps {
    initialPosts?: BlogPost[]
    initialCategories?: BlogCategory[]
}

export function BlogPostsClient({ initialPosts = [], initialCategories = [] }: BlogPostsClientProps) {
    const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
    const [categories, setCategories] = useState<BlogCategory[]>(initialCategories)
    const [loading, setLoading] = useState(initialPosts.length === 0)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

    useEffect(() => {
        // If server already provided data, skip the client-side fetch
        if (initialPosts.length > 0) return

        let cancelled = false

        async function load() {
            setLoading(true)
            try {
                const [postsRes, categoriesRes] = await Promise.allSettled([
                    blogApi.getPosts(0, 50),
                    blogApi.getCategories(),
                ])

                if (!cancelled) {
                    if (postsRes.status === "fulfilled") {
                        setPosts(postsRes.value.items || [])
                    } else {
                        setPosts([])
                    }

                    if (categoriesRes.status === "fulfilled") {
                        setCategories(categoriesRes.value || [])
                    } else {
                        setCategories([])
                    }
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void load()
        return () => { cancelled = true }
    }, [initialPosts])

    const getCategoryName = (id: number) =>
        categories.find((c) => c.id === id)?.name || ""

    const filteredPosts = posts.filter((p) => {
        const matchesSearch =
            !searchTerm ||
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.summary?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = !selectedCategory || p.categoryId === selectedCategory
        return matchesSearch && matchesCategory
    })

    const formatDate = (dateStr: string) => {
        try {
            return formatDateTR(dateStr)
        } catch {
            return ""
        }
    }

    return (
        <>
            {loading && (
                <div className="mb-8 text-sm text-muted-foreground">Yazılar yükleniyor...</div>
            )}

            {/* Search & Category Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-12">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Yazılarda ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        id="blog-search-input"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                        id="blog-category-all"
                    >
                        Tümü
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                            id={`blog-category-${cat.id}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {filteredPosts.length === 0 ? (
                <div className="text-center py-24">
                    <Tag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-serif text-xl text-foreground">Henüz yazı bulunmuyor</h3>
                    <p className="text-muted-foreground mt-2">
                        {searchTerm
                            ? "Arama kriterlerinize uygun yazı bulunamadı."
                            : "Blog yazıları yakında eklenecektir."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPosts.map((post) => (
                        <article
                            key={post.id}
                            className="group bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                        >
                            <Link href={`/blog/${post.slug}`} id={`blog-post-${post.id}`}>
                                {/* Image */}
                                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                                    {post.imageUrl ? (
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                            <Tag className="h-10 w-10 text-primary/30" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Meta */}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                        {post.createdAt && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(post.createdAt)}
                                            </span>
                                        )}
                                        {post.author && (
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {post.author}
                                            </span>
                                        )}
                                    </div>

                                    {/* Category Badge */}
                                    {getCategoryName(post.categoryId) && (
                                        <Badge variant="outline" className="mb-3 text-xs">
                                            {getCategoryName(post.categoryId)}
                                        </Badge>
                                    )}

                                    {/* Title */}
                                    <h2 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>

                                    {/* Summary */}
                                    {post.summary && (
                                        <p className="mt-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                            {post.summary}
                                        </p>
                                    )}

                                    {/* Read More */}
                                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        Devamını Oku
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        </article>
                    ))}
                </div>
            )}
        </>
    )
}
