import type { Metadata } from "next"
import { ContactClient } from "./contact-client"
import type { SiteSettingsResponse } from "@/lib/types"

import { getServerApiUrl } from "@/lib/server-api-url"
const API_URL = getServerApiUrl()

async function fetchSiteSettings(): Promise<SiteSettingsResponse | null> {
  try {
    const res = await fetch(`${API_URL}/v1/site-settings`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await fetchSiteSettings()
  const storeName = s?.storeName || "Can Antika"
  const phone = s?.phone || ""
  const address = s?.address || ""

  const description = [
    `${storeName} ile iletişime geçin.`,
    address || "İstanbul",
    phone ? `Telefon: ${phone}.` : "",
    "Antika sorularınız için bize ulaşın.",
  ].filter(Boolean).join(" ")

  return {
    title: `İletişim | ${storeName} - Bize Ulaşın`,
    description,
    keywords: [`${storeName.toLowerCase()} iletişim`, "antikacı telefon", "istanbul antikacı"],
    openGraph: {
      title: `İletişim | ${storeName}`,
      description: `${storeName} ile iletişime geçin. ${address || "İstanbul"}`,
      type: "website",
      locale: "tr_TR",
    },
  }
}

export default function ContactPage() {
  return <ContactClient />
}
