import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware — sadece security header'ları ekler.
 *
 * NOT: Auth cookie (can_antika_token) api.canantika.com domain'inde
 * set edildiğinden, canantika.com'daki middleware tarafından okunamaz.
 * Tüm auth redirect'leri client-side AuthGuard ile yapılır.
 */

export function middleware(request: NextRequest) {
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
