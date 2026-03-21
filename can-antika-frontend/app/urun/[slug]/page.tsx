import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductPageClient } from "./product-page-client"
import { getServerApiUrl } from "@/lib/server-api-url"


async function fetchProduct(slug: string) {
    const apiUrl = getServerApiUrl()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
        const res = await fetch(`${apiUrl}/v1/product/slug/${encodeURIComponent(slug)}`, {
            cache: "no-store",
            signal: controller.signal,
        })
        if (!res.ok) return null
        const json = await res.json()
        return json.data ?? null
    } catch {
        return null
    } finally {
        clearTimeout(timeout)
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params

    const product = await fetchProduct(slug)
    if (!product) return { title: "Ürün Bulunamadı | Can Antika" }

    const description = product.description
        ? product.description.slice(0, 160)
        : `${product.title} — Can Antika koleksiyonundan antika eser. ₺${product.price?.toLocaleString("tr-TR")}`

    return {
        title: `${product.title} | Can Antika`,
        description,
        keywords: [
            product.title,
            product.category?.name,
            "antika",
            "koleksiyon",
            "can antika",
        ].filter(Boolean),
        openGraph: {
            title: `${product.title} | Can Antika`,
            description,
            type: "website",
            locale: "tr_TR",
            images: product.imageUrls?.[0] ? [{ url: product.imageUrls[0] }] : [],
        },
    }
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const product = await fetchProduct(slug)
    if (!product) notFound()

    return <ProductPageClient initialProduct={product} slug={slug} />
}
