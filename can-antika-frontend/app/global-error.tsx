"use client"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="tr">
            <body className="font-sans antialiased">
                <div className="min-h-screen flex items-center justify-center bg-[#0c0a09] px-4">
                    <div className="text-center max-w-lg">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                            Beklenmeyen Bir Hata Oluştu
                        </h1>
                        <p className="mt-3 text-gray-400">
                            Üzgünüz, bir sorun meydana geldi. Lütfen sayfayı yenileyin veya tekrar deneyin.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <button
                                onClick={reset}
                                className="inline-flex items-center justify-center rounded-md bg-[#c8a97e] px-6 py-3 text-sm font-medium text-[#1c1917] transition-colors hover:bg-[#c8a97e]/90"
                            >
                                Tekrar Dene
                            </button>
                            <a
                                href="/"
                                className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-transparent px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
                            >
                                Ana Sayfaya Dön
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}
