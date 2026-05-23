import { NextResponse } from "next/server"
import { TURKIYE_PROVINCES } from "@/lib/geo/turkiye-provinces"

const TURKIYE_API_BASE_URL = "https://api.turkiyeapi.dev/v1"
const CACHE_SECONDS = 60 * 60 * 24

type RouteKind = "provinces" | "districts" | "neighborhoods"

interface TurkiyeApiUnit {
  id?: number
  name?: string
  postalCode?: string | number | null
}

interface TurkiyeApiResponse {
  data?: TurkiyeApiUnit[]
}

const addressCache = new Map<string, { expiresAt: number; items: TurkiyeApiUnit[] }>()

function isRouteKind(value: string): value is RouteKind {
  return value === "provinces" || value === "districts" || value === "neighborhoods"
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("tr")
}

function filterUnits(items: TurkiyeApiUnit[], query: string) {
  const normalizedQuery = normalizeSearch(query)
  if (!normalizedQuery) return items
  return items.filter((item) => item.name?.toLocaleLowerCase("tr").includes(normalizedQuery))
}

function normalizeUnits(items: TurkiyeApiUnit[]) {
  return items
    .filter((item): item is TurkiyeApiUnit & { id: number; name: string } => typeof item.id === "number" && typeof item.name === "string")
    .map((item) => ({
      id: item.id,
      name: item.name,
      postalCode: item.postalCode ? String(item.postalCode) : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"))
}

async function fetchTurkiyeUnits(resource: string, params: URLSearchParams) {
  const url = new URL(`${TURKIYE_API_BASE_URL}/${resource}`)
  params.forEach((value, key) => url.searchParams.set(key, value))
  const cacheKey = url.toString()
  const cached = addressCache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.items
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: CACHE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Turkiye API ${resource} request failed: ${response.status}`)
  }

  const body = (await response.json()) as TurkiyeApiResponse
  const items = Array.isArray(body.data) ? body.data : []
  addressCache.set(cacheKey, { expiresAt: Date.now() + CACHE_SECONDS * 1000, items })
  return items
}

export async function GET(request: Request, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params

  if (!isRouteKind(kind)) {
    return NextResponse.json({ message: "Geçersiz adres kaynağı" }, { status: 404 })
  }

  const incoming = new URL(request.url).searchParams
  const params = new URLSearchParams()
  params.set("fields", "id,name,postalCode")
  params.set("limit", "1000")
  params.set("sort", "name")

  const provinceId = incoming.get("provinceId")
  const districtId = incoming.get("districtId")
  const query = incoming.get("q") || ""

  if (kind === "provinces") {
    return NextResponse.json(normalizeUnits(filterUnits(TURKIYE_PROVINCES, query)))
  }

  if (kind === "districts") {
    if (!provinceId) {
      return NextResponse.json({ message: "provinceId zorunludur" }, { status: 400 })
    }
    params.set("provinceId", provinceId)
  }

  if (kind === "neighborhoods") {
    if (!districtId) {
      return NextResponse.json({ message: "districtId zorunludur" }, { status: 400 })
    }
    params.set("districtId", districtId)
  }

  try {
    if (kind === "neighborhoods") {
      const [neighborhoods, villages] = await Promise.all([
        fetchTurkiyeUnits("neighborhoods", params),
        fetchTurkiyeUnits("villages", params),
      ])

      return NextResponse.json(normalizeUnits(filterUnits([...neighborhoods, ...villages], query)))
    }

    const units = await fetchTurkiyeUnits(kind, params)
    return NextResponse.json(normalizeUnits(filterUnits(units, query)))
  } catch {
    return NextResponse.json({ message: "Adres verisi alınamadı" }, { status: 502 })
  }
}
