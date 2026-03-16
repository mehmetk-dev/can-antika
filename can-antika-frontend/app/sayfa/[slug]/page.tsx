import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getServerApiUrl } from "@/lib/server-api-url"

type StaticPage = {
    id: number
    title: string
    slug: string
    content: string
    active: boolean
}

const API_URL = getServerApiUrl()

async function fetchStaticPage(slug: string): Promise<StaticPage | null> {
    try {
        const res = await fetch(`${API_URL}/v1/pages/${slug}`, { next: { revalidate: 300 } })
        if (!res.ok) return null

        const json = await res.json()
        return json?.data ?? null
    } catch {
        return null
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const page = await fetchStaticPage(slug)

    if (!page) {
        return { title: "Sayfa Bulunamadı" }
    }

    return {
        title: `${page.title} | Antika Dünyası`,
        description: page.content?.slice(0, 160) ?? page.title,
    }
}

export default async function DynamicStaticPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const page = await fetchStaticPage(slug)

    if (!page || !page.active) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="py-16">
                <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <h1 className="font-serif text-4xl font-bold text-foreground">{page.title}</h1>
                    <article className="prose prose-zinc mt-8 max-w-none whitespace-pre-line text-foreground/90">
                        {page.content}
                    </article>
                </section>
            </main>
            <Footer />
        </div>
    )
}
