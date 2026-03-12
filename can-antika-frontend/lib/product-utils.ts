import type { ProductResponse } from "@/lib/types"

export function getProductAttributes(product: ProductResponse) {
    return {
        era: (product.attributes?.era as string) || "",
        condition: (product.attributes?.condition as string) || "",
        dimensions: (product.attributes?.dimensions as string) || "",
        provenance: (product.attributes?.provenance as string) || "",
        status: (product.attributes?.status as string) || "active",
    }
}

export const eraLabels: Record<string, string> = {
    "19th-century": "19. Yüzyıl",
    ottoman: "Osmanlı",
    victorian: "Viktoryen",
    "art-deco": "Art Deco",
}
