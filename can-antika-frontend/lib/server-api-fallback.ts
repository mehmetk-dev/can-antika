import { getServerApiUrl } from "@/lib/server-api-url"

type ApiEnvelope<T> = {
  data?: T
}

type FetchWithFallbackOptions = {
  revalidate?: number
  timeoutMs?: number
}

function getCandidateApiBaseUrls(): string[] {
  const internalApiUrl = getServerApiUrl()
  const publicApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
  return Array.from(new Set([internalApiUrl, publicApiUrl].filter(Boolean)))
}

export async function fetchApiDataWithFallback<T>(
  path: string,
  options: FetchWithFallbackOptions = {}
): Promise<T | null> {
  const { revalidate = 60, timeoutMs = 2500 } = options
  const baseUrls = getCandidateApiBaseUrls()

  if (baseUrls.length === 0) return null

  const attempts = baseUrls.map(async (baseUrl) => {
    const res = await fetch(`${baseUrl}${path}`, {
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
