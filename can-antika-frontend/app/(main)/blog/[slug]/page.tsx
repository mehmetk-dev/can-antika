import type { Metadata } from "next"
import { cache, Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Calendar, User, ArrowLeft, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BlogContentSanitized } from "./blog-content-sanitized"
import BlogLoading from "./loading"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import type { BlogPost, BlogCategory } from "@/lib/types"
import { formatDateTR } from "@/lib/utils"

function serializeSafeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

const fetchBlogPost = cache(async (slug: string) => {
  const safeSlug = encodeURIComponent(slug)
  return fetchApiDataWithFallback<BlogPost>(`/v1/blog/${safeSlug}`, {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchBlogPost(slug)

  if (!post) {
    return {
      title: "Blog",
      description: "Can Antika blog yazilari.",
    }
  }

  const title = post.title?.trim() || "Blog"
  const description = post.summary || `${title} - Can Antika Blog`

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

  return (
    <Suspense fallback={<BlogLoading />}>
      <BlogDetailResolver slug={slug} />
    </Suspense>
  )
}

async function BlogDetailResolver({ slug }: { slug: string }) {
  const post = await fetchBlogPost(slug)

  if (!post) {
    notFound()
  }

  // Fetch categories in parallel — non-blocking for main content
  const categories = await fetchBlogCategories().then(c => Array.isArray(c) ? c : []).catch(() => [] as BlogCategory[])
  const categoryName = categories.find((c) => c.id === post.categoryId)?.name || ""

  const formatDate = (dateStr: string) => {
    try { return formatDateTR(dateStr) } catch { return "" }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary || post.title,
    image: post.imageUrl ? [post.imageUrl] : [],
    datePublished: post.createdAt,
    author: post.author ? [{ "@type": "Person", name: post.author }] : [],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSafeJsonLd(jsonLd) }}
      />
      <div className="bg-background">
        <main>
          {/* Hero Image — server-rendered, no hydration wait */}
          {post.imageUrl && (
            <section className="py-6 md:py-8">
              <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-muted border border-border/50">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Article — title, meta, summary all server-rendered */}
          <article className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 md:py-12">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Blog&apos;a Dön
              </Link>
              {categoryName && (
                <Badge variant="outline">{categoryName}</Badge>
              )}
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight">
              {post.title}
            </h1>

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

            {post.summary && (
              <p className="mt-8 text-lg text-muted-foreground leading-relaxed border-l-4 border-accent/30 pl-6 italic">
                {post.summary}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 my-10">
              <div className="w-16 h-px bg-border" />
              <div className="w-2 h-2 rotate-45 border border-border" />
              <div className="w-16 h-px bg-border" />
            </div>

            {/* Only content needs client-side DOMPurify */}
            <BlogContentSanitized html={post.content || ""} />

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
      </div>
    </>
  )
}
