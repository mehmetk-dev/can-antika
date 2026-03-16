/**
 * SSR/server-side API URL helper. (AUDIT L1)
 *
 * Container ortamında Docker-internal URL'yi (INTERNAL_API_URL) tercih eder,
 * yoksa public URL'ye (NEXT_PUBLIC_API_URL) düşer.
 *
 * Bu fonksiyon yalnızca Server Component / Route Handler / Middleware gibi
 * sunucu tarafı kodlarda kullanılmalıdır.
 */
export function getServerApiUrl(): string {
    const fallbackApiUrl =
        process.env.NODE_ENV === "production"
            ? "https://api.canantika.com"
            : "http://localhost:8085";

    return (
        process.env.INTERNAL_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        fallbackApiUrl
    ).replace(/\/$/, "");
}
