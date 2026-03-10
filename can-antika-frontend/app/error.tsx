"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Error boundary caught an error — logged server-side by Next.js
    }, [error])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>

                <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                    Bir Hata Oluştu
                </h1>
                <p className="mt-3 text-muted-foreground">
                    Beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyin.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-serif text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Tekrar Dene
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-6 py-3 font-serif text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        </div>
    )
}
