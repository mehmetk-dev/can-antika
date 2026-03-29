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
  cancelSignal?: AbortSignal,
): Promise<T | null> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const signal = cancelSignal
    ? AbortSignal.any([timeoutSignal, cancelSignal])
    : timeoutSignal
  const res = await fetch(buildApiUrl(baseUrl, path), {
    next: { revalidate },
    signal,
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
  // Cap at 700ms — on Docker internal network backend responds < 50ms (Redis cache)
  if (lastWorkingBaseUrl) {
    try {
      const result = await tryFetch<T>(lastWorkingBaseUrl, path, revalidate, Math.min(timeoutMs, 700))
      if (result) return result
    } catch {
      lastWorkingBaseUrl = null
    }
  }

  // Try all remaining candidates in parallel — first success wins, losers get aborted
  const candidates = baseUrls.filter((u) => u !== lastWorkingBaseUrl)
  if (candidates.length === 0) return null

  const abort = new AbortController()

  try {
    const { result, baseUrl } = await Promise.any(
      candidates.map(async (baseUrl) => {
        const result = await tryFetch<T>(baseUrl, path, revalidate, timeoutMs, abort.signal)
        if (result === null) throw new Error("no data")
        return { result, baseUrl }
      })
    )
    abort.abort() // cancel still-running losers
    lastWorkingBaseUrl = baseUrl
    return result
  } catch {
    return null
  }
}
