import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://canantika.com"
import { getServerApiUrl } from "@/lib/server-api-url"
const API_URL = getServerApiUrl()

interface ProductItem {
    id: number
    slug: string
    updatedAt?: string
    createdAt?: string
}

interface BlogItem {
    id: number
    slug: string
    createdAt?: string
}

interface CategoryItem {
    id: number
    name: string
    slug?: string
}

async function fetchProducts(): Promise<ProductItem[]> {
    const pageSize = 100
    const maxPages = 100
    const allProducts: ProductItem[] = []
    let page = 0
    let total = Number.POSITIVE_INFINITY

    try {
        while (page < maxPages && allProducts.length < total) {
            const res = await fetch(`${API_URL}/v1/product?page=${page}&size=${pageSize}`, {
                next: { revalidate: 3600 },
            })
            if (!res.ok) break

            const json = await res.json()
            const items = Array.isArray(json?.data?.items) ? (json.data.items as ProductItem[]) : []
            const totalElement = Number(json?.data?.totalElement)

            if (Number.isFinite(totalElement) && totalElement > 0) {
                total = totalElement
            }
            if (items.length === 0) break

            allProducts.push(...items)
            page += 1
        }

        return allProducts
    } catch {
        return []
    }
}

async function fetchBlogPosts(): Promise<BlogItem[]> {
    try {
        const res = await fetch(`${API_URL}/v1/blog?page=0&size=500`, {
            next: { revalidate: 3600 },
        })
        if (!res.ok) return []
        const json = await res.json()
        return json.data?.items ?? json.data ?? []
    } catch {
        return []
    }
}

async function fetchCategories(): Promise<CategoryItem[]> {
    try {
        const res = await fetch(`${API_URL}/v1/category`, {
            next: { revalidate: 3600 },
        })
        if (!res.ok) return []
        const json = await res.json()
        return json.data ?? []
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
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
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
        url: `${SITE_URL}/urunler?category=${cat.slug || cat.name}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }))

    return [...staticPages, ...productPages, ...blogPages, ...categoryPages]
}
