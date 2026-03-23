import type { ResultData } from "./types";

const ENV_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const REQUEST_TIMEOUT_MS = 120000;

// ======================== Core Fetch ========================

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined | null>;
    headers?: Record<string, string>;
    noAuth?: boolean;
}

function normalizeBaseUrl(baseUrl: string): string | null {
    const normalized = baseUrl.trim().replace(/\/$/, "");
    if (!normalized) return null;

    if (/^https?:\/\//i.test(normalized)) {
        return normalized;
    }

    if (typeof window !== "undefined" && window.location?.origin) {
        // Relative env values (e.g. /v1) should resolve to same-origin API root.
        return window.location.origin.replace(/\/$/, "");
    }

    return null;
}

function getCandidateBaseUrls(): string[] {
    const urls: string[] = [];
    const seen = new Set<string>();

    const addUrl = (url?: string | null) => {
        if (!url) return;
        const normalized = url.replace(/\/$/, "");
        if (seen.has(normalized)) return;
        seen.add(normalized);
        urls.push(normalized);
    };

    const normalizedEnvBaseUrl = normalizeBaseUrl(ENV_BASE_URL);

    if (typeof window !== "undefined" && window.location?.origin) {
        const originBaseUrl = window.location.origin.replace(/\/$/, "");
        const hostname = window.location.hostname.toLowerCase();
        const onCanAntikaDomain = hostname === "canantika.com" || hostname === "www.canantika.com";

        // Prefer explicit env URL when it points to a different host (e.g. api.canantika.com).
        if (normalizedEnvBaseUrl && normalizedEnvBaseUrl !== originBaseUrl) {
            addUrl(normalizedEnvBaseUrl);
        }

        // Production safety net: if /v1 proxy on main domain breaks, call API domain directly.
        if (onCanAntikaDomain) {
            addUrl("https://api.canantika.com");
        }

        addUrl(originBaseUrl);
    }

    addUrl(normalizedEnvBaseUrl);

    if (urls.length === 0) {
        addUrl("http://localhost:8085");
        addUrl("http://127.0.0.1:8085");
    }

    return urls;
}

function buildUrl(baseUrl: string, path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const normalizedBase = /^https?:\/\//i.test(baseUrl)
        ? baseUrl
        : (typeof window !== "undefined"
            ? new URL(baseUrl, window.location.origin).toString()
            : `http://localhost:8085${baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`}`);

    const url = new URL(path.replace(/^\//, ""), `${normalizedBase.replace(/\/$/, "")}/`);

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

async function tryRefreshToken(baseUrl: string): Promise<boolean> {
    // Yalnızca tek bir refresh isteği olsun (race condition önleme)
    if (isRefreshing && refreshPromise) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${baseUrl}/v1/auth/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Cookie'den refresh token gönderilir
                body: JSON.stringify({}), // Body boş - backend cookie'den okur
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

    const baseUrls = getCandidateBaseUrls();
    let lastError: Error | null = null;

    for (const baseUrl of baseUrls) {
        try {
            const url = buildUrl(baseUrl, path, params);
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
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });

            // Auto-refresh on 401
            if (res.status === 401 && !noAuth) {
                const refreshed = await tryRefreshToken(baseUrl);
                if (refreshed) {
                    res = await fetch(url, {
                        method,
                        headers,
                        credentials: "include",
                        body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
                        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                    });
                } else {
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
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("İstek başarısız");
            continue;
        }
    }

    throw lastError ?? new Error("API bağlantısı kurulamadı");
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
        const baseUrls = getCandidateBaseUrls();
        let lastError: Error | null = null;

        for (const baseUrl of baseUrls) {
            try {
                const url = buildUrl(baseUrl, path, params);
                const headers: Record<string, string> = { ...extraHeaders };

                if (body !== undefined && !(body instanceof FormData)) {
                    headers["Content-Type"] = "application/json";
                }

                const res = await fetch(url, {
                    method,
                    headers,
                    credentials: "include",
                    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
                    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                });

                if (!res.ok) {
                    let errorMessage = `API error: ${res.status}`;
                    try { const e = await res.json(); if (e.message) errorMessage = e.message; } catch { /* */ }
                    throw new Error(errorMessage);
                }

                return res.json();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error("İstek başarısız");
                continue;
            }
        }

        throw lastError ?? new Error("API bağlantısı kurulamadı");
    },
};
