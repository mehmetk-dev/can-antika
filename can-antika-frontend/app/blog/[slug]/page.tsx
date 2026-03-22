import type { Metadata } from "next"
import { cache } from "react"
import { BlogDetailClient } from "./blog-detail-client"
import { fetchApiDataWithFallback } from "@/lib/server-api-fallback"
import type { BlogPost } from "@/lib/types"

function slugToTitle(slug: string): string {
  const raw = decodeURIComponent(slug || "")
  const normalized = raw
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")

  if (!normalized || /^\d+$/.test(normalized)) return "Blog"

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const fetchBlogPost = cache(async (slug: string) => {
  const safeSlug = encodeURIComponent(slug)
  return fetchApiDataWithFallback<BlogPost>(`/v1/blog/${safeSlug}`, {
    revalidate: 60,
    timeoutMs: 900,
  })
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const title = slugToTitle(slug)
  const description = `${title} - Can Antika Blog yazisi.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/blog/${slug}`,
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

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.summary || post.title,
        image: post.imageUrl ? [post.imageUrl] : [],
        datePublished: post.createdAt,
        author: post.author
          ? [
              {
                "@type": "Person",
                name: post.author,
              },
            ]
          : [],
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogDetailClient initialPost={post} slug={slug} />
    </>
  )
}
