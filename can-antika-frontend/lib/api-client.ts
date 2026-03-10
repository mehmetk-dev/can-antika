import type { ResultData } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
    || "http://localhost:8085";

// ======================== Core Fetch ========================

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined | null>;
    headers?: Record<string, string>;
    noAuth?: boolean;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const combinedPath = `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const url = new URL(combinedPath);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, String(value));
            }
        });
    }
    return url.toString();
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
    // Yalnızca tek bir refresh isteği olsun (race condition önleme)
    if (isRefreshing && refreshPromise) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${BASE_URL}/v1/auth/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Cookie'den refresh token gönderilir
                body: JSON.stringify({}), // Body boş - backend cookie'den okur
            });
            return res.ok;
        } catch {
            return false;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const { body, params, headers: extraHeaders, noAuth } = options;

    const url = buildUrl(path, params);
    const headers: Record<string, string> = {
        ...extraHeaders,
    };

    if (body !== undefined && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    let res = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Auto-refresh on 401
    if (res.status === 401 && !noAuth) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            // Yeni cookie set edildi, isteği tekrarla
            res = await fetch(url, {
                method,
                headers,
                credentials: "include",
                body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
            });
        } else {
            if (typeof window !== "undefined" && !window.location.pathname.startsWith("/giris")) {
                window.location.href = "/giris";
            }
            throw new Error("Oturum süresi doldu. Lütfen tekrar giriş yapın.");
        }
    }

    if (!res.ok) {
        let errorMessage = `API error: ${res.status}`;
        try {
            const errorBody = await res.json();
            if (errorBody.message) errorMessage = errorBody.message;
        } catch {
            // ignore parse error
        }
        throw new Error(errorMessage);
    }

    const result: ResultData<T> = await res.json();

    if (!result.status) {
        throw new Error(result.message || "İşlem başarısız");
    }

    return result.data;
}

// ======================== Convenience Methods ========================

export const api = {
    get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
    post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
    put: <T>(path: string, options?: RequestOptions) => request<T>("PUT", path, options),
    patch: <T>(path: string, options?: RequestOptions) => request<T>("PATCH", path, options),
    delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),

    /** For endpoints that return ResponseEntity directly (not wrapped in ResultData) */
    raw: async <T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> => {
        const { body, params, headers: extraHeaders } = options;
        const url = buildUrl(path, params);
        const headers: Record<string, string> = { ...extraHeaders };

        if (body !== undefined && !(body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        const res = await fetch(url, {
            method,
            headers,
            credentials: "include",
            body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            let errorMessage = `API error: ${res.status}`;
            try { const e = await res.json(); if (e.message) errorMessage = e.message; } catch { /* */ }
            throw new Error(errorMessage);
        }

        return res.json();
    },
};
