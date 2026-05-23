import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display, Cinzel, Cormorant_Garamond, Italiana, Pinyon_Script } from "next/font/google"

import { ConsentManagedTracking } from "@/components/legal/consent-managed-tracking"
import { Providers } from "./providers"
import "./globals.css"

import { fetchSiteSettings } from "@/lib/server/site-settings"

const _inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap", preload: true })
const _playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--font-playfair", display: "swap", preload: false })
const _cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" })
const _cormorant = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], variable: "--font-cormorant", weight: ["400", "500", "600", "700"], display: "swap" })
const _italiana = Italiana({ subsets: ["latin"], variable: "--font-italiana", weight: ["400"], display: "swap" })
const _pinyon = Pinyon_Script({ subsets: ["latin"], variable: "--font-pinyon", weight: ["400"], display: "swap" })

const GA_ID_PATTERN = /^(G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-\d+-\d+)$/i
const FB_PIXEL_ID_PATTERN = /^\d{5,20}$/
const DEFAULT_SITE_DESCRIPTION =
  "Can Antika, Beyoğlu Avrupa Pasajı'nda antika ve koleksiyon ürünleri sunar. Ürünleri, fiyatları, teslimat ve iade koşullarını siteden inceleyebilirsiniz."
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
  const metaDesc = DEFAULT_SITE_DESCRIPTION
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
    alternates: {
      canonical: "/",
      languages: {
        "tr-TR": "/",
      },
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
        { url: "/icon.png", sizes: "192x192", type: "image/png" },
        { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-icon.png",
    },
  }
}

function serializeSafeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

function buildOrganizationJsonLd(s: Awaited<ReturnType<typeof fetchSiteSettings>>) {
  const name = s?.storeName || "Can Antika"
  const phone = s?.phone || ""
  const email = s?.email || ""
  const address = s?.address || ""

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: "https://canantika.com",
    logo: "https://canantika.com/logo.png",
    ...(phone || email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            ...(phone ? { telephone: phone, contactType: "customer service" } : {}),
            ...(email ? { email } : {}),
            availableLanguage: "Turkish",
          },
        }
      : {}),
    ...(address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: address,
            addressLocality: "İstanbul",
            addressCountry: "TR",
          },
        }
      : {}),
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
  const orgJsonLd = buildOrganizationJsonLd(s)

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="JMg3Dhw9bWfxsppDyIqh6264chrOFgraoUckPANJzv8" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || "https://api.canantika.com"} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || "https://api.canantika.com"} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeSafeJsonLd(orgJsonLd) }}
        />
      </head>
      <body className={`${_inter.variable} ${_playfair.variable} ${_cinzel.variable} ${_cormorant.variable} ${_italiana.variable} ${_pinyon.variable} font-sans antialiased`}>
        <ConsentManagedTracking googleAnalyticsId={gaId} facebookPixelId={fbPixelId} />
        <Providers initialSiteSettings={s}>{children}</Providers>
      </body>
    </html>
  )
}
