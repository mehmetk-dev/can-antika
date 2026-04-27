"use client"

import { useMemo } from "react"
import DOMPurify from "dompurify"

export function BlogContentSanitized({ html }: { html: string }) {
    const sanitized = useMemo(() => {
        if (!html || html.trim().length === 0) return ""
        return DOMPurify.sanitize(html)
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
