import type { Metadata } from "next"
import { CatalogClient } from "./catalog-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Antika Koleksiyon | Can Antika - Eşsiz Antika Eserler",
  description:
    "Osmanlı, Viktoryen, Art Deco ve 19. yüzyıl antikalarını keşfedin. Uzman onaylı, tek ve özgün antika eserler. Mobilya, porselen, saatler, halılar ve daha fazlası.",
  keywords: [
    "antika",
    "antika mobilya",
    "osmanlı antika",
    "viktoryen antika",
    "art deco",
    "antika porselen",
    "antika saat",
    "antika halı",
    "istanbul antikacı",
  ],
  openGraph: {
    title: "Antika Koleksiyon | Can Antika",
    description: "Eşsiz antika eserleri keşfedin. Uzman onaylı, tek ve özgün parçalar.",
    type: "website",
    locale: "tr_TR",
  },
}

export default function CatalogPage() {
  return <CatalogClient />
}
