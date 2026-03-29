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

/**
 * fetch() öğesine signal verMEYİZ — Next.js Data Cache (ISR) signal
 * görünce revalidate kuralını yok sayıp her istekte SSR yapar.
 * Timeout'u Promise.race ile uyguluyoruz; fetch arka planda tamamlanırsa
 * Next.js sonucu yine de cache'e alır (bir sonraki istek anında döner).
 */
async function tryFetch<T>(
  baseUrl: string,
  path: string,
  revalidate: number,
  timeoutMs: number,
): Promise<T | null> {
  const fetchPromise = fetch(buildApiUrl(baseUrl, path), {
    next: { revalidate },
    // signal yok — Next.js Data Cache korunuyor
  }).then(async (res) => {
    if (!res.ok) return null
    const json = (await res.json()) as ApiEnvelope<T>
    return json?.data ?? null
  })

  // Deadline: fetchPromise süre aşarsa null döner, arka plandaki fetch devam eder
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
  return Promise.race([fetchPromise, timeout])
}

export async function fetchApiDataWithFallback<T>(
  path: string,
  options: FetchWithFallbackOptions = {}
): Promise<T | null> {
  const { revalidate = 60, timeoutMs = 1200 } = options
  const baseUrls = getServerApiUrlCandidates()

  if (baseUrls.length === 0) return null

  // Try the last working URL first for fast path
  // Cap at 700ms — on Docker internal network backend responds < 50ms (Redis cache)
  if (lastWorkingBaseUrl) {
    try {
      const result = await tryFetch<T>(lastWorkingBaseUrl, path, revalidate, Math.min(timeoutMs, 700))
      if (result) return result
    } catch {
      lastWorkingBaseUrl = null
    }
  }

  // Try all remaining candidates in parallel — first success wins
  const candidates = baseUrls.filter((u) => u !== lastWorkingBaseUrl)
  if (candidates.length === 0) return null

  try {
    const { result, baseUrl } = await Promise.any(
      candidates.map(async (baseUrl) => {
        const result = await tryFetch<T>(baseUrl, path, revalidate, timeoutMs)
        if (result === null) throw new Error("no data")
        return { result, baseUrl }
      })
    )
    lastWorkingBaseUrl = baseUrl
    return result
  } catch {
    return null
  }
}
