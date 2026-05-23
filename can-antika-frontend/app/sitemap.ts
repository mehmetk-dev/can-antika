import type { MetadataRoute } from "next"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import { getProductUrl } from "@/lib/product/product-url"
import { resolveImageUrl } from "@/lib/product/image-url"
import type { ProductResponse, CursorResponse, BlogPost } from "@/lib/types"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://canantika.com"

function resolveSitemapImageUrl(raw: string): string {
    const imageUrl = resolveImageUrl(raw)
    return /^https?:\/\//i.test(imageUrl) ? imageUrl : new URL(imageUrl, SITE_URL).toString()
}

async function fetchAllProducts(): Promise<ProductResponse[]> {
    const allProducts: ProductResponse[] = []
    let page = 0
    const size = 100
    const maxPages = 20

    while (page < maxPages) {
        try {
            const data = await fetchApiDataWithFallback<CursorResponse<ProductResponse>>(
                `/v1/product?page=${page}&size=${size}&sortBy=createdAt&direction=desc`,
                { revalidate: 300, timeoutMs: 8000 }
            )
            const items = data?.items ?? []
            if (items.length === 0) break
            allProducts.push(...items)
            if (items.length < size) break
            page++
        } catch {
            break
        }
    }
    return allProducts
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
    try {
        const data = await fetchApiDataWithFallback<CursorResponse<BlogPost>>(
            "/v1/blog?page=0&size=100",
            { revalidate: 300, timeoutMs: 3000 }
        )
        return data?.items ?? []
    } catch {
        return []
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [products, blogPosts] = await Promise.all([
        fetchAllProducts(),
        fetchBlogPosts(),
    ])

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${SITE_URL}/urunler`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/iletisim`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.6,
        },
        {
            url: `${SITE_URL}/hakkimizda`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${SITE_URL}/sss`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${SITE_URL}/teslimat`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.4,
        },
        {
            url: `${SITE_URL}/gizlilik`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/kvkk`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/kullanim-kosullari`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/iade`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/cerezler`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/mesafeli-satis-sozlesmesi`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/on-bilgilendirme-formu`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ]

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
        url: `${SITE_URL}${getProductUrl(product)}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: product.imageUrls?.length
            ? product.imageUrls.slice(0, 3).map((url) => resolveSitemapImageUrl(url))
            : undefined,
    }))

    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug || post.id}`,
        lastModified: post.createdAt ? new Date(post.createdAt) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
    }))

    return [...staticPages, ...productPages, ...blogPages]
}
