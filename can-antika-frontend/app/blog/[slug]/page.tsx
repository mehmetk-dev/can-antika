import type { Metadata } from "next"
import { BlogDetailClient } from "./blog-detail-client"

function slugToTitle(slug: string) {
    return slug
        .split("-")
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const title = slugToTitle(slug) || "Blog Yazısı"
    const description = "Can Antika Blog yazı detayı"

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            locale: "tr_TR",
            images: [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [],
        },
    }
}

export default async function BlogDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    return <BlogDetailClient initialPost={null} slug={slug} />
}
