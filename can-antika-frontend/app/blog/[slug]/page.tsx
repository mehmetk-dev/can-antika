import type { Metadata } from "next"
import { BlogDetailClient } from "./blog-detail-client"
import { getServerApiUrl } from "@/lib/server-api-url"

const API_URL = getServerApiUrl()
const FALLBACK_API_URL = "https://api.canantika.com"

async function fetchBlogPost(slug: string) {
    const apiBases = Array.from(new Set([API_URL, FALLBACK_API_URL]))
    for (const base of apiBases) {
        try {
            const res = await fetch(`${base}/v1/blog/${slug}`, {
                next: { revalidate: 60 },
            })
            if (!res.ok) continue
            const json = await res.json()
            if (json?.data) return json.data
        } catch {
            // try next api base
        }
    }
    return null
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const post = await fetchBlogPost(slug)

    if (!post) {
        return {
            title: "Yazı Bulunamadı",
            description: "Aradığınız blog yazısı bulunamadı.",
        }
    }

    const title = post.title
    const description = post.summary || `${post.title} — Can Antika Blog`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            locale: "tr_TR",
            images: post.imageUrl ? [{ url: post.imageUrl, alt: title }] : [],
            publishedTime: post.createdAt,
            authors: post.author ? [post.author] : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: post.imageUrl ? [post.imageUrl] : [],
        },
    }
}

export default async function BlogDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const post = await fetchBlogPost(slug)

    return <BlogDetailClient initialPost={post} />
}
