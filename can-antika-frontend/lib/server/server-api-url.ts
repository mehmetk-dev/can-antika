/**
 * Server-side API URL helpers.
 *
 * NOTE:
 * - Relative values like `/v1` are valid in the browser but invalid for Node.js fetch.
 * - We only keep absolute URLs here and always provide safe fallbacks.
 */

function toAbsoluteUrl(value?: string): string | null {
  if (!value) return null
  const normalized = value.trim().replace(/\/$/, "")
  if (!normalized) return null
  return /^https?:\/\//i.test(normalized) ? normalized : null
}

export function getServerApiUrlCandidates(): string[] {
  const urls = new Set<string>()

  const addUrl = (value?: string | null) => {
    const url = toAbsoluteUrl(value || "")
    if (url) urls.add(url)
  }

  const internalApiUrl = toAbsoluteUrl(process.env.INTERNAL_API_URL)
  const publicApiUrl = toAbsoluteUrl(process.env.NEXT_PUBLIC_API_URL)

  if (process.env.NODE_ENV === "production") {
    // Prefer private/internal routes on the server (avoid external API hop/timeouts).
    addUrl(internalApiUrl)
    addUrl("http://backend:8080")
    addUrl("http://127.0.0.1:8080")
    addUrl("http://localhost:8080")
    // Public URL as last resort — if all internal routes fail, still get data
    addUrl(publicApiUrl)
  } else {
    addUrl(internalApiUrl)
    addUrl(publicApiUrl)
    addUrl("http://localhost:8080")
    addUrl("http://127.0.0.1:8080")
    addUrl("http://localhost:8085")
    addUrl("http://127.0.0.1:8085")
    addUrl("http://backend:8080")
  }

  return Array.from(urls)
}

export function getServerApiUrl(): string {
  return getServerApiUrlCandidates()[0] ?? "http://localhost:8080"
}
