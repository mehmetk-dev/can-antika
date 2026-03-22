import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerApiUrlCandidates } from "@/lib/server-api-url";

const MAINTENANCE_CACHE_TTL_MS = 30_000;
let maintenanceModeCache: { value: boolean; expiresAt: number } | null = null;

async function readMaintenanceMode(apiBase: string): Promise<boolean> {
    const now = Date.now();
    if (maintenanceModeCache && maintenanceModeCache.expiresAt > now) {
        return maintenanceModeCache.value;
    }

    try {
        const settingsUrl = new URL("/v1/site-settings", `${apiBase.replace(/\/$/, "")}/`).toString();
        const settingsRes = await fetch(settingsUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(1200),
        });

        if (!settingsRes.ok) {
            return false;
        }

        const json = await settingsRes.json();
        const maintenanceMode = json?.data?.maintenanceMode === true;
        maintenanceModeCache = {
            value: maintenanceMode,
            expiresAt: now + MAINTENANCE_CACHE_TTL_MS,
        };
        return maintenanceMode;
    } catch {
        // Fail-open: upstream yavas/erisilemez oldugunda siteyi bakim moduna kilitleme.
        return false;
    }
}

/**
 * Lightweight middleware - sadece security header'lari ekler.
 *
 * NOT: Auth cookie (can_antika_token) api.canantika.com domain'inde
 * set edildiginden, canantika.com'daki middleware tarafindan okunamaz.
 * Tum auth redirect'leri client-side AuthGuard ile yapilir.
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
        const [apiBase] = getServerApiUrlCandidates();

        const maintenanceMode = await readMaintenanceMode(apiBase ?? "http://localhost:8085");
        if (maintenanceMode) {
            const maintenanceUrl = new URL("/bakim", request.url);
            return NextResponse.redirect(maintenanceUrl);
        }
    }

    const response = NextResponse.next();

    // Security headers (defense-in-depth)
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
