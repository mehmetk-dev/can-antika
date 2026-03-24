import type { ProductResponse } from "@/lib/types"

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number") return String(value)
  return ""
}

function findFirstText(values: unknown[]): string {
  for (const value of values) {
    const text = asText(value)
    if (text) return text
  }
  return ""
}

export function resolvePeriodLabel(product: ProductResponse): string {
  const attrs = (product.attributes ?? {}) as Record<string, unknown>
  const rawPeriod = (product as ProductResponse & { periodName?: unknown; period?: unknown }).period

  const periodNameFromObject =
    rawPeriod && typeof rawPeriod === "object" && "name" in rawPeriod
      ? asText((rawPeriod as { name?: unknown }).name)
      : ""

  const periodNameFromRaw = typeof rawPeriod === "string" ? asText(rawPeriod) : ""

  return findFirstText([
    product.period?.name,
    periodNameFromObject,
    periodNameFromRaw,
    (product as ProductResponse & { periodName?: unknown }).periodName,
    attrs.era,
    attrs.period,
    attrs.periodName,
    attrs.period_name,
    attrs.donem,
    attrs["dönem"],
  ])
}

export function getProductAttributes(product: ProductResponse) {
  return {
    era: resolvePeriodLabel(product),
    condition: asText((product.attributes as Record<string, unknown> | undefined)?.condition),
    dimensions: asText((product.attributes as Record<string, unknown> | undefined)?.dimensions),
    provenance: asText((product.attributes as Record<string, unknown> | undefined)?.provenance),
    status: asText((product.attributes as Record<string, unknown> | undefined)?.status) || "active",
  }
}

export const eraLabels: Record<string, string> = {
  "19th-century": "19. Yüzyıl",
  ottoman: "Osmanlı",
  victorian: "Viktoryen",
  "art-deco": "Art Deco",
}
