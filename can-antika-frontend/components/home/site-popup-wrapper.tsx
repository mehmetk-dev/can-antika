"use client"

import dynamic from "next/dynamic"

const SitePopup = dynamic(
  () => import("@/components/home/site-popup").then(m => ({ default: m.SitePopup })),
  { ssr: false }
)

export function SitePopupWrapper() {
  return <SitePopup />
}
