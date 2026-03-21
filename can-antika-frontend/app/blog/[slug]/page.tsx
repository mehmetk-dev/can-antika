import type { Metadata } from "next"
import { cache } from "react"
import { BlogDetailClient } from "./blog-detail-client"
import { fetchApiDataWithFallback } from "@/lib/server-api-fallback"
import type { BlogPost } from "@/lib/types"

const fetchBlogPost = cache(async (slug: string) => {
  const safeSlug = encodeURIComponent(slug)
  return fetchApiDataWithFallback<BlogPost>(`/v1/blog/${safeSlug}`, {
    revalidate: 60,
    timeoutMs: 2500,
  })
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchBlogPost(slug)

  if (!post) {
    return {
      title: "Blog | Can Antika",
      description: "Can Antika blog yazilari.",
    }
  }

  const title = post.title
  const description = post.summary || `${post.title} - Can Antika Blog`

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
