import { getServerApiUrlCandidates } from "@/lib/server-api-url"

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

export async function fetchApiDataWithFallback<T>(
  path: string,
  options: FetchWithFallbackOptions = {}
): Promise<T | null> {
  const { revalidate = 60, timeoutMs = 1200 } = options
  const baseUrls = getServerApiUrlCandidates()

  if (baseUrls.length === 0) return null

  for (const baseUrl of baseUrls) {
    try {
      const res = await fetch(buildApiUrl(baseUrl, path), {
        next: { revalidate },
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (!res.ok) continue

      const json = (await res.json()) as ApiEnvelope<T>
      if (json?.data) {
        return json.data
      }
    } catch {
      // Try next candidate
    }
  }

  return null
}
