import { getServerApiUrlCandidates } from "./server-api-url"

type ApiEnvelope<T> = {
  data?: T
}

type FetchWithFallbackOptions = {
  revalidate?: number
  timeoutMs?: number
}

function buildApiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return new URL(normalizedPath, `${normalizedBase}/`).toString()
}

// Cache the last working base URL to try it first next time
let lastWorkingBaseUrl: string | null = null

async function tryFetch<T>(
  baseUrl: string,
  path: string,
  revalidate: number,
  timeoutMs: number,
): Promise<T | null> {
  const res = await fetch(buildApiUrl(baseUrl, path), {
    next: { revalidate },
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) return null

  const json = (await res.json()) as ApiEnvelope<T>
  return json?.data ?? null
}

export async function fetchApiDataWithFallback<T>(
  path: string,
  options: FetchWithFallbackOptions = {}
): Promise<T | null> {
  const { revalidate = 60, timeoutMs = 1200 } = options
  const baseUrls = getServerApiUrlCandidates()

  if (baseUrls.length === 0) return null

  // Try the last working URL first for fast path
  if (lastWorkingBaseUrl) {
    try {
      const result = await tryFetch<T>(lastWorkingBaseUrl, path, revalidate, Math.min(timeoutMs, 2000))
      if (result) return result
    } catch {
      lastWorkingBaseUrl = null
    }
  }

  // Sequential fallback through candidates with a shorter per-candidate timeout
  const perCandidateTimeout = Math.min(timeoutMs, 1500)

  for (const baseUrl of baseUrls) {
    if (baseUrl === lastWorkingBaseUrl) continue  // Already tried
    try {
      const result = await tryFetch<T>(baseUrl, path, revalidate, perCandidateTimeout)
      if (result) {
        lastWorkingBaseUrl = baseUrl
        return result
      }
    } catch {
      // Try next candidate
    }
  }

  return null
}
