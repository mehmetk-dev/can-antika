import { getServerApiUrlCandidates } from "./server-api-url"

type ApiEnvelope<T> = {
  data?: T
}

type FetchWithFallbackOptions = {
  revalidate?: number
  timeoutMs?: number
}

type FetchAttempt<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string }

function debugApiFallbackLog(level: "info" | "warn", message: string) {
  if (process.env.SERVER_API_FALLBACK_DEBUG !== "true") return
  console[level](message)
}

export type ApiFetchTiming = {
  path: string
  durationMs: number
  source: "fast-path" | "fallback"
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
): Promise<FetchAttempt<T>> {
  const fetchPromise = fetch(buildApiUrl(baseUrl, path), {
    next: { revalidate },
    // signal yok — Next.js Data Cache korunuyor
  }).then(async (res) => {
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` } as const
    const json = (await res.json()) as ApiEnvelope<T>
    if (json?.data == null) return { ok: false, reason: "empty data" } as const
    return { ok: true, data: json.data } as const
  }).catch((error) => ({
    ok: false,
    reason: error instanceof Error ? error.message : "request failed",
  }) as const)

  // Deadline: fetchPromise süre aşarsa null döner, arka plandaki fetch devam eder
  const timeout = new Promise<FetchAttempt<T>>((resolve) => {
    setTimeout(() => resolve({ ok: false, reason: `timeout ${timeoutMs}ms` }), timeoutMs)
  })
  return Promise.race([fetchPromise, timeout])
}

export async function fetchApiDataWithFallback<T>(
  path: string,
  options: FetchWithFallbackOptions = {}
): Promise<T | null> {
  const { revalidate = 60, timeoutMs = 1200 } = options
  const start = performance.now()
  const baseUrls = getServerApiUrlCandidates()

  if (baseUrls.length === 0) {
    debugApiFallbackLog("warn", `[server-api-fallback] No API URL candidates available for ${path}`)
    return null
  }

  // Try the last working URL first for fast path. Do not cap this below the
  // route timeout; in Dockerfile deployments the last working URL may be the
  // public API domain, where a 700ms cap can force unnecessary client refetches.
  if (lastWorkingBaseUrl) {
    try {
      const attempt = await tryFetch<T>(lastWorkingBaseUrl, path, revalidate, timeoutMs)
      if (attempt.ok) {
        const dur = Math.round(performance.now() - start)
        if (dur > 200) {
          debugApiFallbackLog("info", `[server-api-fallback] ${path} → ${dur}ms (fast-path)`)
        }
        return attempt.data
      }
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
        const attempt = await tryFetch<T>(baseUrl, path, revalidate, timeoutMs)
        if (!attempt.ok) throw new Error(`${baseUrl}: ${attempt.reason}`)
        return { result: attempt.data, baseUrl }
      })
    )
    lastWorkingBaseUrl = baseUrl
    const dur = Math.round(performance.now() - start)
    if (dur > 200) {
      debugApiFallbackLog("info", `[server-api-fallback] ${path} → ${dur}ms (fallback)`)
    }
    return result
  } catch (error) {
    const reason = error instanceof AggregateError
      ? error.errors.map((item) => item instanceof Error ? item.message : String(item)).join("; ")
      : error instanceof Error ? error.message : String(error)
    debugApiFallbackLog("warn", `[server-api-fallback] No API candidate returned data for ${path}: ${reason}`)
    return null
  }
}
