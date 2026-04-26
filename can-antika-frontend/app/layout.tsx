import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Inter, Playfair_Display, Cinzel } from "next/font/google"

import { Providers } from "./providers"
import "./globals.css"

import { fetchSiteSettings } from "@/lib/server/site-settings"

const _inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap", preload: true })
const _playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--font-playfair", display: "swap", preload: false })
const _cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" })

const GA_ID_PATTERN = /^(G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-\d+-\d+)$/i
const FB_PIXEL_ID_PATTERN = /^\d{5,20}$/

function sanitizeGoogleAnalyticsId(value?: string | null): string {
  const normalized = (value || "").trim()
  return GA_ID_PATTERN.test(normalized) ? normalized : ""
}

function sanitizeFacebookPixelId(value?: string | null): string {
  const normalized = (value || "").trim()
  return FB_PIXEL_ID_PATTERN.test(normalized) ? normalized : ""
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await fetchSiteSettings()

  const storeName = s?.storeName || "Can Antika"
  const metaTitle = s?.metaTitle || `${storeName} | Geçmişin Zarafeti`
  const metaDesc =
    s?.metaDescription ||
    "Eşsiz antika eserler, uzman onayı ve güvenli teslimat ile sizlerleyiz. 1990'dan beri kalite ve güven."
  const keywords = s?.metaKeywords
    ? s.metaKeywords.split(",").map((k: string) => k.trim())
    : ["antika", "antika mağazası", "osmanlı antika", "istanbul antika", "can antika"]

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
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png" },
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
  const gaId = sanitizeGoogleAnalyticsId(s?.googleAnalyticsId)
  const fbPixelId = sanitizeFacebookPixelId(s?.facebookPixelId)

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || "https://api.canantika.com"} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || "https://api.canantika.com"} />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}

        {fbPixelId && (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`}
          </Script>
        )}
      </head>
      <body className={`${_inter.variable} ${_playfair.variable} ${_cinzel.variable} font-sans antialiased`}>
        <Providers initialSiteSettings={s}>{children}</Providers>
      </body>
    </html>
  )
}
