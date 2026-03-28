import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerApiUrlCandidates } from "@/lib/server/server-api-url";

const MAINTENANCE_CACHE_TTL_MS = 60_000;
const MAINTENANCE_TIMEOUT_MS = 400;
let maintenanceModeCache: { value: boolean; expiresAt: number } | null = null;

async function fetchMaintenanceModeFromBase(apiBase: string): Promise<boolean> {
    const settingsUrl = new URL("/v1/site-settings", `${apiBase.replace(/\/$/, "")}/`).toString();
    const settingsRes = await fetch(settingsUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(MAINTENANCE_TIMEOUT_MS),
    });

    if (!settingsRes.ok) {
        throw new Error(`HTTP ${settingsRes.status}`);
    }

    const json = await settingsRes.json();
    const envelopeMode = json?.data?.maintenanceMode;
    const directMode = json?.maintenanceMode;

    if (typeof envelopeMode === "boolean") return envelopeMode;
    if (typeof directMode === "boolean") return directMode;

    throw new Error("maintenanceMode payload missing");
}

async function readMaintenanceMode(): Promise<boolean> {
    const now = Date.now();
    if (maintenanceModeCache && maintenanceModeCache.expiresAt > now) {
        return maintenanceModeCache.value;
    }

    const apiBases = getServerApiUrlCandidates();
    if (apiBases.length === 0) {
        return false;
    }

    for (const apiBase of apiBases) {
        try {
            const maintenanceMode = await fetchMaintenanceModeFromBase(apiBase);
            maintenanceModeCache = {
                value: maintenanceMode,
                expiresAt: now + MAINTENANCE_CACHE_TTL_MS,
            };
            return maintenanceMode;
        } catch {
            // Try next candidate
        }
    }

    // Fail-open: upstream yavas/erisilemez oldugunda siteyi bakim moduna kilitleme.
    return false;
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

    // Normalize multiple slashes to single slash (e.g. //biz-kimiz → /biz-kimiz)
    if (pathname !== "/" && /\/{2,}/.test(pathname)) {
        const cleaned = pathname.replace(/\/{2,}/g, "/");
        const url = request.nextUrl.clone();
        url.pathname = cleaned;
        return NextResponse.redirect(url, 308);
    }

    const skipMaintenanceCheck =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/bakim") ||
        pathname.startsWith("/oauth2") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";

    if (!skipMaintenanceCheck) {
        const maintenanceMode = await readMaintenanceMode();
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
