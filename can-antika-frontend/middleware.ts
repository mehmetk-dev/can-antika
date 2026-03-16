import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware — sadece security header'ları ekler.
 *
 * NOT: Auth cookie (can_antika_token) api.canantika.com domain'inde
 * set edildiğinden, canantika.com'daki middleware tarafından okunamaz.
 * Tüm auth redirect'leri client-side AuthGuard ile yapılır.
 */

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const skipMaintenanceCheck =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/bakim") ||
        pathname.startsWith("/oauth2") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";

    if (!skipMaintenanceCheck) {
        const apiBase =
            process.env.INTERNAL_API_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            "http://localhost:8085";

        try {
            const settingsRes = await fetch(`${apiBase.replace(/\/$/, "")}/v1/site-settings`, {
                method: "GET",
                headers: { Accept: "application/json" },
                cache: "no-store",
            });

            if (settingsRes.ok) {
                const json = await settingsRes.json();
                const maintenanceMode = json?.data?.maintenanceMode === true;

                if (maintenanceMode) {
                    const maintenanceUrl = new URL("/bakim", request.url);
                    return NextResponse.redirect(maintenanceUrl);
                }
            }
        } catch {
            // Settings endpoint fail ederse siteyi bloklama
        }
    }

    const response = NextResponse.next();

    // Security headers (defence-in-depth)
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except static files and images
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
