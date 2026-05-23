export type TurkiyeAddressKind = "provinces" | "districts" | "neighborhoods"

export interface TurkiyeAddressUnit {
  id: number
  name: string
  postalCode?: string | null
}

interface TurkiyeAddressParams {
  provinceId?: string | number
  districtId?: string | number
  q?: string
}

export async function getTurkiyeAddressUnits(kind: TurkiyeAddressKind, params: TurkiyeAddressParams = {}) {
  const url = new URL(`/api/turkiye-address/${kind}`, window.location.origin)

  if (params.provinceId) {
    url.searchParams.set("provinceId", String(params.provinceId))
  }

  if (params.districtId) {
    url.searchParams.set("districtId", String(params.districtId))
  }

  if (params.q?.trim()) {
    url.searchParams.set("q", params.q.trim())
  }

  const response = await fetch(url, { headers: { Accept: "application/json" } })

  if (!response.ok) {
    throw new Error("Adres seçenekleri alınamadı")
  }

  return response.json() as Promise<TurkiyeAddressUnit[]>
}
