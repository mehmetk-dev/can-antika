"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export const COOKIE_CONSENT_STORAGE_KEY = "can-antika-cookie-consent-v1"
export const COOKIE_CONSENT_EVENT = "can-antika-cookie-consent-change"
export const COOKIE_CONSENT_OPEN_EVENT = "can-antika-cookie-consent-open"

export type CookieConsentPreferences = {
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

function saveConsent(preferences: CookieConsentPreferences) {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(preferences))
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
}

function readConsentRaw(): string | null {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  } catch {
    return null
  }
}

function subscribeToConsent(callback: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function buildConsent(analytics: boolean, marketing: boolean): CookieConsentPreferences {
  return {
    necessary: true,
    analytics,
    marketing,
    updatedAt: new Date().toISOString(),
  }
}

function parseConsent(rawConsent: string | null): CookieConsentPreferences | null {
  try {
    return rawConsent ? JSON.parse(rawConsent) as CookieConsentPreferences : null
  } catch {
    return null
  }
}

export function CookieConsentBanner() {
  const rawConsent = useSyncExternalStore(subscribeToConsent, readConsentRaw, () => "server")
  const [panelOpen, setPanelOpen] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const openFromExternalControl = () => {
      const current = parseConsent(readConsentRaw())
      setAnalytics(Boolean(current?.analytics))
      setMarketing(Boolean(current?.marketing))
      setShowPreferences(true)
      setPanelOpen(true)
    }

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, openFromExternalControl)
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, openFromExternalControl)
  }, [])

  if (rawConsent === "server") return null

  const persist = (nextAnalytics: boolean, nextMarketing: boolean) => {
    saveConsent(buildConsent(nextAnalytics, nextMarketing))
    setPanelOpen(false)
    setShowPreferences(false)
  }

  if (rawConsent !== null && !panelOpen) {
    return null
  }

  return (
    <section
      aria-label="Çerez tercihleri"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-4xl rounded-lg border border-border bg-background p-4 shadow-2xl sm:bottom-5 sm:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Çerez tercihleri</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Zorunlu çerezler siteyi çalıştırmak için kullanılır. Analitik ve pazarlama çerezleri yalnızca açık rızanızla etkinleşir.
            Ayrıntılar için{" "}
            <Link href="/cerezler" className="font-medium text-foreground underline-offset-4 hover:underline">
              Çerez Politikası
            </Link>
            {" "}sayfasını inceleyebilirsiniz.
          </p>

          {showPreferences && (
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
                <Checkbox checked disabled className="mt-0.5" />
                <span>
                  <span className="block font-medium text-foreground">Zorunlu</span>
                  <span className="text-muted-foreground">Güvenlik, sepet ve oturum işlemleri için her zaman aktiftir.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
                <Checkbox checked={analytics} onCheckedChange={(checked) => setAnalytics(checked === true)} className="mt-0.5" />
                <span>
                  <span className="block font-medium text-foreground">Analitik</span>
                  <span className="text-muted-foreground">Site kullanımını ölçmemize yardımcı olur.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm sm:col-span-2">
                <Checkbox checked={marketing} onCheckedChange={(checked) => setMarketing(checked === true)} className="mt-0.5" />
                <span>
                  <span className="block font-medium text-foreground">Pazarlama</span>
                  <span className="text-muted-foreground">Reklam ve yeniden pazarlama ölçümleri için kullanılır.</span>
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
          <Button type="button" onClick={() => persist(true, true)}>Hepsini Kabul Et</Button>
          <Button type="button" variant="outline" onClick={() => persist(false, false)}>Hepsini Reddet</Button>
          {showPreferences ? (
            <Button type="button" variant="secondary" onClick={() => persist(analytics, marketing)}>Tercihleri Kaydet</Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setShowPreferences(true)}>Tercihleri Yönet</Button>
          )}
        </div>
      </div>
    </section>
  )
}

export function CookieConsentSettingsButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT))}
    >
      Çerez Ayarları
    </Button>
  )
}
