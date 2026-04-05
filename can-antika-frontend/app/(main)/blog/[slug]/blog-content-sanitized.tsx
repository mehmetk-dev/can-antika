"use client"

import { useState, useEffect } from "react"

export function BlogContentSanitized({ html }: { html: string }) {
    const [sanitized, setSanitized] = useState("")

    useEffect(() => {
        if (!html) return
        let cancelled = false
        import("dompurify").then((mod) => {
            if (cancelled) return
            setSanitized(mod.default.sanitize(html))
        })
        return () => { cancelled = true }
    }, [html])

    if (!sanitized) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted/40 rounded w-full" />
                <div className="h-4 bg-muted/40 rounded w-5/6" />
                <div className="h-4 bg-muted/40 rounded w-4/6" />
                <div className="h-4 bg-muted/40 rounded w-full" />
                <div className="h-4 bg-muted/40 rounded w-3/6" />
            </div>
        )
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
