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

  const attempts = baseUrls.map(async (baseUrl) => {
    const res = await fetch(buildApiUrl(baseUrl, path), {
      next: { revalidate },
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = (await res.json()) as ApiEnvelope<T>
    if (!json?.data) throw new Error("Missing data payload")

    return json.data
  })

  try {
    return await Promise.any(attempts)
  } catch {
    return null
  }
}
