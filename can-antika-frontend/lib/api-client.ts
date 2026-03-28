import type { ResultData } from "./types";
import { clearAuthSessionFlag, hasAuthSessionFlag } from "./auth-session";

const ENV_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const REQUEST_TIMEOUT_MS = 15000;
const REFRESH_TIMEOUT_MS = 8000;
const CSRF_COOKIE_NAME = "XSRF-TOKEN";
const CSRF_HEADER_NAME = "X-XSRF-TOKEN";

// ======================== Core Fetch ========================

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const CSRF_SAFE_METHODS = new Set<HttpMethod>(["GET", "HEAD", "OPTIONS", "TRACE"]);

interface RequestOptions {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined | null>;
    headers?: Record<string, string>;
    noAuth?: boolean;
    timeoutMs?: number;
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

function isLoopbackHostname(hostname: string): boolean {
    const h = hostname.toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

function isLoopbackUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return isLoopbackHostname(parsed.hostname);
    } catch {
        return false;
    }
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
    // If browser is opened from non-loopback host, skip localhost env URLs.
    if (!isBrowser) {
        addUrl(normalizedEnvBaseUrl);
    } else if (normalizedEnvBaseUrl) {
        const browserHost = window.location?.hostname || "";
        if (isLoopbackHostname(browserHost) || !isLoopbackUrl(normalizedEnvBaseUrl)) {
            addUrl(normalizedEnvBaseUrl);
        }
    }

    if (isBrowser && window.location?.origin) {
        const originBaseUrl = window.location.origin.replace(/\/$/, "");
        const hostname = window.location.hostname.toLowerCase();
        const isLoopbackBrowser = isLoopbackHostname(hostname);
        const onCanAntikaDomain = hostname === "canantika.com" || hostname === "www.canantika.com";

        // Production safety net: call API domain directly on main domain.
        if (onCanAntikaDomain) {
            addUrl("https://api.canantika.com");
        }

        // In development, keep local fallbacks and same-origin proxy option.
        if (process.env.NODE_ENV !== "production") {
            const runtimeHostApi = `${window.location.protocol}//${window.location.hostname}:8085`;
            addUrl(runtimeHostApi);
            if (isLoopbackBrowser) {
                addUrl("http://localhost:8085");
                addUrl("http://127.0.0.1:8085");
            }
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

function readCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`));
    if (!match) return null;

    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

function attachCsrfHeader(headers: Record<string, string>, method: HttpMethod): void {
    if (CSRF_SAFE_METHODS.has(method)) {
        return;
    }

    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (!csrfToken) {
        return;
    }

    headers[CSRF_HEADER_NAME] = csrfToken;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

function createTimeoutHandle(timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
    const timeoutFactory = (AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }).timeout;
    if (typeof timeoutFactory === "function") {
        return {
            signal: timeoutFactory(timeoutMs),
            cleanup: () => {
                // Native AbortSignal.timeout cleans itself up.
            },
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return {
        signal: controller.signal,
        cleanup: () => {
            clearTimeout(timeoutId);
        },
    };
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
    const { signal, cleanup } = createTimeoutHandle(timeoutMs);
    try {
        return await fetch(input, { ...init, signal });
    } finally {
        cleanup();
    }
}

function isNetworkLikeError(error: unknown): boolean {
    if (error instanceof TypeError) return true;
    if (!(error instanceof Error)) return false;

    const normalizedName = error.name.toLowerCase();
    const normalizedMessage = error.message.toLowerCase();

    return (
        normalizedName === "aborterror" ||
        normalizedName === "timeouterror" ||
        normalizedMessage.includes("failed to fetch") ||
        normalizedMessage.includes("networkerror") ||
        normalizedMessage.includes("network request failed") ||
        normalizedMessage.includes("load failed") ||
        normalizedMessage.includes("timed out")
    );
}

async function tryRefreshToken(baseUrl: string): Promise<boolean> {
    if (typeof window !== "undefined" && !hasAuthSessionFlag()) {
        return false;
    }

    // YalnÄ±zca tek bir refresh isteÄŸi olsun (race condition Ã¶nleme)
    if (isRefreshing && refreshPromise) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const res = await fetchWithTimeout(`${baseUrl}/v1/auth/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Cookie'den refresh token gÃ¶nderilir
                body: JSON.stringify({}), // Body boÅŸ - backend cookie'den okur
            }, REFRESH_TIMEOUT_MS);

            if (res.status === 401 || res.status === 400) {
                clearAuthSessionFlag();
            }
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
    const { body, params, headers: extraHeaders, noAuth, timeoutMs } = options;
    const effectiveTimeoutMs = timeoutMs ?? REQUEST_TIMEOUT_MS;

    const baseUrls = getCandidateBaseUrls();
    let lastError: Error | null = null;

    for (const baseUrl of baseUrls) {
        try {
            const url = buildUrl(baseUrl, path, params);
            const headers: Record<string, string> = {
                ...extraHeaders,
            };
            attachCsrfHeader(headers, method);

            if (body !== undefined && !(body instanceof FormData)) {
                headers["Content-Type"] = "application/json";
            }

            let res = await fetchWithTimeout(url, {
                method,
                headers,
                credentials: "include",
                body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
            }, effectiveTimeoutMs);

            // Auto-refresh on 401
            const hasSession = typeof window === "undefined" ? true : hasAuthSessionFlag();
            if (res.status === 401 && !noAuth && hasSession) {
                const refreshed = await tryRefreshToken(baseUrl);
                if (refreshed) {
                    res = await fetchWithTimeout(url, {
                        method,
                        headers,
                        credentials: "include",
                        body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
                    }, effectiveTimeoutMs);
                } else {
                    throw new Error("Oturum sÃ¼resi doldu. LÃ¼tfen tekrar giriÅŸ yapÄ±n.");
                }
            }

            if (!res.ok) {
                const isExpectedGuestAuthCheck = noAuth && res.status === 401 && path === "/v1/auth/me";
                if (!isExpectedGuestAuthCheck && process.env.NODE_ENV !== "production") {
                    console.error(`Fetch failed for URL: ${url}, Status: ${res.status}`);
                }
                let errorMessage = `API error: ${res.status}`;
                const correlationId = res.headers.get("X-Correlation-Id");
                try {
                    const errorBody = await res.json();
                    if (errorBody.message) errorMessage = errorBody.message;
                } catch {
                    // ignore parse error
                }
                if (res.status === 403) {
                    errorMessage = "Bu islem icin yetkiniz bulunmuyor.";
                } else if (res.status === 429) {
                    errorMessage = "Cok fazla deneme yaptiniz. Lutfen biraz bekleyip tekrar deneyin.";
                } else if (!noAuth && res.status === 401 && !hasSession) {
                    errorMessage = "Bu islem icin giris yapmaniz gerekiyor.";
                }
                if (correlationId) {
                    errorMessage = `${errorMessage} (Ref: ${correlationId})`;
                }
                throw new Error(errorMessage);
            }

            const result: ResultData<T> = await res.json();

            if (!result.status) {
                throw new Error(result.message || "Ä°ÅŸlem baÅŸarÄ±sÄ±z");
            }

            return result.data;
        } catch (error: any) {
            lastError = error instanceof Error ? error : new Error("Ä°stek baÅŸarÄ±sÄ±z");
            
            // Only continue for networking errors (down server, etc.)
            const isNetworkError = isNetworkLikeError(error);

            if (isNetworkError) {
                continue;
            }
            // Real API error (404, 401 etc.) or re-throw after logging
            throw lastError;
        }
    }

    throw lastError ?? new Error("API baÄŸlantÄ±sÄ± kurulamadÄ±");
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
        const { body, params, headers: extraHeaders, timeoutMs } = options;
        const effectiveTimeoutMs = timeoutMs ?? REQUEST_TIMEOUT_MS;
        const baseUrls = getCandidateBaseUrls();
        let lastError: Error | null = null;

        for (const baseUrl of baseUrls) {
            try {
                const url = buildUrl(baseUrl, path, params);
                const headers: Record<string, string> = { ...extraHeaders };
                attachCsrfHeader(headers, method);

                if (body !== undefined && !(body instanceof FormData)) {
                    headers["Content-Type"] = "application/json";
                }

                const res = await fetchWithTimeout(url, {
                    method,
                    headers,
                    credentials: "include",
                    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
                }, effectiveTimeoutMs);

                if (!res.ok) {
                    let errorMessage = `API error: ${res.status}`;
                    try { const e = await res.json(); if (e.message) errorMessage = e.message; } catch { /* */ }
                    throw new Error(errorMessage);
                }

                return res.json();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error("Ä°stek baÅŸarÄ±sÄ±z");
                continue;
            }
        }

        throw lastError ?? new Error("API baÄŸlantÄ±sÄ± kurulamadÄ±");
    },
};
