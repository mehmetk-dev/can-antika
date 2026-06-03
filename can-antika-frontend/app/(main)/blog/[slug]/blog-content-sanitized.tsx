"use client"

import { useEffect, useState } from "react"

const HTML_TAG_PATTERN = /<[a-z][\s\S]*>/i

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

function plainTextToHtml(text: string): string {
    return text
        .trim()
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
        .join("")
}

export function prepareBlogContentHtml(content: string): string {
    return HTML_TAG_PATTERN.test(content) ? content : plainTextToHtml(content)
}

export function BlogContentSanitized({ html }: { html: string }) {
    const [sanitized, setSanitized] = useState("")

    useEffect(() => {
        let cancelled = false

        async function sanitizeHtml() {
            if (!html || html.trim().length === 0) {
                setSanitized("")
                return
            }

            const { default: DOMPurify } = await import("dompurify")
            if (!cancelled) setSanitized(DOMPurify.sanitize(prepareBlogContentHtml(html)))
        }

        sanitizeHtml().catch(() => {
            if (!cancelled) setSanitized("")
        })

        return () => {
            cancelled = true
        }
    }, [html])

    if (!sanitized) {
        return null
    }

    return (
        <div
            className="prose prose-lg max-w-none
                prose-headings:font-serif prose-headings:text-foreground
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground
                prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    )
}
