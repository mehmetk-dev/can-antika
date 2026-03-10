import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Inter, Playfair_Display } from "next/font/google"
import { Providers } from "./providers"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

import { getServerApiUrl } from "@/lib/server-api-url"
const API_URL = getServerApiUrl()

/* ── Server-side site settings fetch (SEO için) ── */
async function fetchSiteSettings() {
  try {
    const res = await fetch(`${API_URL}/v1/site-settings`, {
      next: { revalidate: 3600 }, // 1 saatte bir yenile
    })
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
  const metaTitle = s?.metaTitle || `${storeName} | Geçmişin Zarafeti`
  const metaDesc = s?.metaDescription || "Eşsiz antika eserler, uzman onayı ve güvenli teslimat ile sizlerleyiz. 1990'dan beri kalite ve güven."
  const keywords = s?.metaKeywords
    ? s.metaKeywords.split(",").map((k: string) => k.trim())
    : ["antika", "antika mağaza", "osmanlı antika", "istanbul antika", "can antika"]

  return {
    title: {
      default: metaTitle,
      template: `%s | ${storeName}`,
    },
    description: metaDesc,
    keywords,
    authors: [{ name: storeName }],
    creator: storeName,
    metadataBase: new URL("https://canantika.com"),
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: storeName,
      title: metaTitle,
      description: metaDesc,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: storeName }],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
      images: ["/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    icons: {
      icon: [
        { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
        { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-icon.png",
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const s = await fetchSiteSettings()
  const gaId = s?.googleAnalyticsId || ""
  const fbPixelId = s?.facebookPixelId || ""

  return (
    <html lang="tr">
      <head>
        {/* Google Analytics */}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        {/* Facebook Pixel */}
        {fbPixelId && (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`}
          </Script>
        )}
        {/* customHeadScripts alanı kaldırıldı — Stored XSS riski (AUDIT C2) */}
      </head>
      <body className={`${_inter.variable} ${_playfair.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
