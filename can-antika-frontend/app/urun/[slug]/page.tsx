import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { ProductPageClient } from "./product-page-client"
import { getServerApiUrl } from "@/lib/server-api-url"


const fetchProduct = cache(async (slug: string) => {
    const internalApiUrl = getServerApiUrl()
    const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.canantika.com"

    try {
        let res = await fetch(`${internalApiUrl}/v1/product/slug/${encodeURIComponent(slug)}`, {
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
        }).catch(() => null);

        // Docker içindeki ağ sorunu yaşanırsa, public URL üzerinden tekrar dene
        if (!res || !res.ok) {
            res = await fetch(`${publicApiUrl}/v1/product/slug/${encodeURIComponent(slug)}`, {
                cache: "no-store",
                signal: AbortSignal.timeout(5000),
            }).catch(() => null);
        }

        if (!res || !res.ok) return null
        const json = await res.json()
        return json.data ?? null
    } catch {
        return null
    }
})

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
