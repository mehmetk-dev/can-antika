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

function stripV1Suffix(url: string): string {
    return url.replace(/\/v1$/i, "");
}

function normalizeBaseUrl(baseUrl: string): string | null {
    const normalized = baseUrl.trim().replace(/\/$/, "");
    if (!normalized) return null;

    if (/^https?:\/\//i.test(normalized)) {
        return stripV1Suffix(normalized);
    }

    // Relative values like /v1 are valid only if there's an explicit proxy.
    // We avoid forcing same-origin in production since many deployments use api subdomain.
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
    const internalApiUrl = normalizeBaseUrl(process.env.INTERNAL_API_URL || "");

    const isBrowser = typeof window !== "undefined";

    // Server-side: Always use INTERNAL_API_URL first
    if (!isBrowser && internalApiUrl) {
        addUrl(internalApiUrl);
    }

    // Explicitly configured public API URL
    addUrl(normalizedEnvBaseUrl);

    if (isBrowser && window.location?.origin) {
        const originBaseUrl = window.location.origin.replace(/\/$/, "");
        const hostname = window.location.hostname.toLowerCase();
        const onCanAntikaDomain = hostname === "canantika.com" || hostname === "www.canantika.com";

        // Production safety net: call API domain directly on main domain.
        if (onCanAntikaDomain) {
            addUrl("https://api.canantika.com");
        }

        // In development, keep local fallbacks and same-origin proxy option.
        if (process.env.NODE_ENV !== "production") {
            addUrl("http://localhost:8080");
            addUrl("http://127.0.0.1:8080");
            addUrl("http://localhost:8085");
            addUrl("http://127.0.0.1:8085");
            addUrl(originBaseUrl);
        } else if (!normalizedEnvBaseUrl && !onCanAntikaDomain) {
            // Non-canantika production environments may use same-origin proxy.
            addUrl(originBaseUrl);
        }
    } else {
        // Server-side fallbacks
        if (process.env.NODE_ENV !== "production") {
            addUrl("http://localhost:8080");
            addUrl("http://127.0.0.1:8080");
            addUrl("http://localhost:8085");
            addUrl("http://127.0.0.1:8085");
        }
        addUrl("http://backend:8080");
        addUrl("https://api.canantika.com");

        // Fallback for Node.js if internalApiUrl was not set
        if (!internalApiUrl && process.env.INTERNAL_API_URL) {
            addUrl(process.env.INTERNAL_API_URL);
        }
    }

    return urls;
}

function buildUrl(baseUrl: string, path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const normalizedBase = /^https?:\/\//i.test(baseUrl)
        ? stripV1Suffix(baseUrl)
        : (typeof window !== "undefined"
            ? new URL(baseUrl, window.location.origin).toString()
            : `http://localhost:8080${baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`}`);

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
                const isExpectedGuestAuthCheck = noAuth && res.status === 401 && path === "/v1/auth/me";
                if (!isExpectedGuestAuthCheck && process.env.NODE_ENV !== "production") {
                    console.error(`Fetch failed for URL: ${url}, Status: ${res.status}`);
                }
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
        } catch (error: any) {
            lastError = error instanceof Error ? error : new Error("İstek başarısız");
            
            // Only continue for networking errors (down server, etc.)
            const isNetworkError = 
                error instanceof TypeError || 
                error?.message === "AbortError" || 
                (error?.message && error.message.includes("NetworkError")) ||
                error?.message === "Failed to fetch";

            if (isNetworkError) {
                continue;
            }
            // Real API error (404, 401 etc.) or re-throw after logging
            throw lastError;
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
