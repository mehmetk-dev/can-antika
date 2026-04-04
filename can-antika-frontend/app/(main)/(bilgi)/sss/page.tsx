import type { Metadata } from "next"
import { FaqClient } from "./faq-client"
import { fetchApiDataWithFallback } from "@/lib/server/server-api-fallback"
import type { FaqItem } from "@/lib/types"

export const revalidate = 300

export const metadata: Metadata = {
    title: "Sıkça Sorulan Sorular",
    description: "Can Antika hakkında merak ettikleriniz ve sıkça sorulan soruların yanıtları.",
}

export default async function FaqPage() {
    const faqs = await fetchApiDataWithFallback<FaqItem[]>("/v1/faq", {
        revalidate: 300,
        timeoutMs: 1800,
    })

    const initialFaqs = Array.isArray(faqs)
        ? [...faqs].sort((a, b) => a.displayOrder - b.displayOrder)
        : []

    return <FaqClient initialFaqs={initialFaqs} />
}
