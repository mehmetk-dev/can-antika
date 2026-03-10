import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side auth redirect middleware. (AUDIT M10)
 *
 * HttpOnly cookie varlığını kontrol eder — token geçerliliğini
 * doğrulamaz (JWT secret client'ta yok), sadece "oturum var mı?"
 * seviyesinde erken redirect sağlar.
 */

const AUTH_COOKIE = "can_antika_token";

/** Giriş yapmış kullanıcının görmemesi gereken sayfalar */
const GUEST_ONLY = ["/giris", "/kayit"];

/** Giriş gerektiren kullanıcı sayfaları */
const PROTECTED_PATHS = ["/hesap", "/siparis"];

/** Admin alanı */
const ADMIN_PREFIX = "/admin";
const ADMIN_LOGIN = "/admin/giris";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hasToken = request.cookies.has(AUTH_COOKIE);

    // 1) Giriş yapmış kullanıcı /giris veya /kayit'a gitmeye çalışırsa → ana sayfa
    if (hasToken && GUEST_ONLY.some((p) => pathname === p)) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // 2) Korumalı kullanıcı sayfaları — token yoksa → /giris
    if (!hasToken && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL("/giris", request.url));
    }

    // 3) Admin alanı — login sayfası hariç, token yoksa → /admin/giris
    if (
        !hasToken &&
        pathname.startsWith(ADMIN_PREFIX) &&
        pathname !== ADMIN_LOGIN
    ) {
        return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/giris",
        "/kayit",
        "/hesap/:path*",
        "/siparis/:path*",
        "/admin/:path*",
    ],
};
