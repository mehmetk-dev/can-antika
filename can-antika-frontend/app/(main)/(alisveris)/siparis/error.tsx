"use client"

import Link from "next/link"

export default function CheckoutError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <h1 className="font-serif text-2xl font-semibold text-foreground">Sipariş Hatası</h1>
                <p className="mt-3 text-muted-foreground">Sipariş işlemi sırasında bir hata oluştu. Sepetiniz korunmaktadır.</p>
                <div className="mt-6 flex gap-3 justify-center">
                    <button onClick={reset} className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        Tekrar Dene
                    </button>
                    <Link href="/sepet" className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                        Sepete Dön
                    </Link>
                </div>
            </div>
        </div>
    )
}
