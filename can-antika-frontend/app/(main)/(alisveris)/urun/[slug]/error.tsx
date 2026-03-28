"use client"

import Link from "next/link"

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <h1 className="font-serif text-2xl font-semibold text-foreground">Ürün Yüklenemedi</h1>
                <p className="mt-3 text-muted-foreground">Bu ürünü görüntülerken bir hata oluştu.</p>
                <div className="mt-6 flex gap-3 justify-center">
                    <button onClick={reset} className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        Tekrar Dene
                    </button>
                    <Link href="/urunler" className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                        Ürünlere Dön
                    </Link>
                </div>
            </div>
        </div>
    )
}
