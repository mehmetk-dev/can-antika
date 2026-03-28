import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="text-center max-w-lg">
                    <div className="relative mx-auto mb-8">
                        <p className="font-serif text-[8rem] font-bold leading-none text-primary/10 select-none">404</p>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="h-20 w-20 text-primary/40" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
                                <path d="M40,12 L40,18 M40,62 L40,68 M12,40 L18,40 M62,40 L68,40" stroke="currentColor" strokeWidth="1.5" />
                                <circle cx="40" cy="40" r="4" fill="currentColor" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
                        Sayfa Bulunamadı
                    </h1>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                        Koleksiyonumuza göz atarak aradığınızı bulabilirsiniz.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-serif text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Ana Sayfaya Dön
                        </Link>
                        <Link
                            href="/urunler"
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 font-serif text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            Koleksiyona Göz At
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
