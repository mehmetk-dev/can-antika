"use client"

import { useSyncExternalStore } from "react"
import Script from "next/script"

import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_STORAGE_KEY, type CookieConsentPreferences } from "./cookie-consent-banner"

function readConsentRaw(): string | null {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  } catch {
    return null
  }
}

function parseConsent(rawConsent: string | null): CookieConsentPreferences | null {
  if (!rawConsent) {
    return null
  }

  try {
    return JSON.parse(rawConsent) as CookieConsentPreferences
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

export function ConsentManagedTracking({
  googleAnalyticsId,
  facebookPixelId,
}: {
  googleAnalyticsId?: string
  facebookPixelId?: string
}) {
  const rawConsent = useSyncExternalStore(subscribeToConsent, readConsentRaw, () => null)
  const consent = parseConsent(rawConsent)

  const analyticsAllowed = Boolean(consent?.analytics && googleAnalyticsId)
  const marketingAllowed = Boolean(consent?.marketing && facebookPixelId)

  return (
    <>
      {analyticsAllowed && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId!)}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${googleAnalyticsId}');`}
          </Script>
        </>
      )}

      {marketingAllowed && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${facebookPixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  )
}
