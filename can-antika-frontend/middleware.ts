import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAINTENANCE_CACHE_TTL_MS = 300_000;
let maintenanceModeCache: { value: boolean; expiresAt: number } | null = null;

async function readMaintenanceMode(apiBase: string): Promise<boolean> {
    const now = Date.now();
    if (maintenanceModeCache && maintenanceModeCache.expiresAt > now) {
        return maintenanceModeCache.value;
    }

    try {
        const settingsRes = await fetch(`${apiBase.replace(/\/$/, "")}/v1/site-settings`, {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(150),
        });

        if (!settingsRes.ok) {
            return maintenanceModeCache?.value ?? false;
        }

        const json = await settingsRes.json();
        const maintenanceMode = json?.data?.maintenanceMode === true;
        maintenanceModeCache = {
            value: maintenanceMode,
            expiresAt: now + MAINTENANCE_CACHE_TTL_MS,
        };
        return maintenanceMode;
    } catch {
        // Upstream yavaş/erişilemez durumda navigasyonu bloklama.
        return maintenanceModeCache?.value ?? false;
    }
}

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

        const maintenanceMode = await readMaintenanceMode(apiBase);
        if (maintenanceMode) {
            const maintenanceUrl = new URL("/bakim", request.url);
            return NextResponse.redirect(maintenanceUrl);
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
