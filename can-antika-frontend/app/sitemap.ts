import type { MetadataRoute } from "next"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import type { ProductResponse, CursorResponse, CategoryResponse, BlogPost } from "@/lib/types"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://canantika.com"

async function fetchProducts(): Promise<ProductResponse[]> {
    try {
        const data = await fetchApiDataWithFallback<CursorResponse<ProductResponse>>(
            "/v1/product?page=0&size=100&sortBy=id&direction=desc",
            { revalidate: 300, timeoutMs: 5000 }
        )
        return data?.items ?? []
    } catch {
        return []
    }
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

async function fetchCategories(): Promise<CategoryResponse[]> {
    try {
        const data = await fetchApiDataWithFallback<CategoryResponse[]>(
            "/v1/category",
            { revalidate: 300, timeoutMs: 3000 }
        )
        return data ?? []
    } catch {
        return []
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [products, blogPosts, categories] = await Promise.all([
        fetchProducts(),
        fetchBlogPosts(),
        fetchCategories(),
    ])

    // Statik sayfalar
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
    ]

    // Ürün sayfaları
    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
        url: `${SITE_URL}/urun/${product.slug || product.id}`,
        lastModified: new Date(), // ProductResponse doesn't have updatedAt in current types
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }))

    // Blog yazıları
    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug || post.id}`,
        lastModified: post.createdAt ? new Date(post.createdAt) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
    }))

    // Kategori sayfaları
    const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
        url: `${SITE_URL}/urunler?category=${encodeURIComponent(cat.name)}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }))

    return [...staticPages, ...productPages, ...blogPages, ...categoryPages]
}

