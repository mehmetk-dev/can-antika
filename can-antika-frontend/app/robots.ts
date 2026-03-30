import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://canantika.com"

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/hesap/",
                    "/siparis/",
                    "/sepet/",
                    "/oauth2/",
                    "/bakim/",
                ],
            },
            // AI crawler'larını engelle (Cloudflare managed robots.txt kapatılınca bu devralır)
            {
                userAgent: [
                    "GPTBot",
                    "ClaudeBot",
                    "CCBot",
                    "Google-Extended",
                    "Bytespider",
                    "Amazonbot",
                    "Applebot-Extended",
                    "meta-externalagent",
                ],
                disallow: "/",
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
