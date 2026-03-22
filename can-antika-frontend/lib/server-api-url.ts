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

  const internalApiUrl = toAbsoluteUrl(process.env.INTERNAL_API_URL)
  const publicApiUrl = toAbsoluteUrl(process.env.NEXT_PUBLIC_API_URL)

  if (internalApiUrl) urls.add(internalApiUrl)
  if (publicApiUrl) urls.add(publicApiUrl)

  const defaults =
    process.env.NODE_ENV === "production"
      ? ["http://backend:8080", "https://api.canantika.com", "https://canantika.com"]
      : ["http://localhost:8085", "http://127.0.0.1:8085", "http://backend:8080"]

  defaults.forEach((url) => urls.add(url))
  return Array.from(urls)
}

export function getServerApiUrl(): string {
  return getServerApiUrlCandidates()[0] ?? "http://localhost:8085"
}
