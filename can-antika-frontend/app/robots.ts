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
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
