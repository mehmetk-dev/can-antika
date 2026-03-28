const AUTH_SESSION_KEY = "can_antika_auth_session";

function canUseStorage(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function hasAuthSessionFlag(): boolean {
    if (!canUseStorage()) return false;
    try {
        return window.localStorage.getItem(AUTH_SESSION_KEY) === "1";
    } catch {
        return false;
    }
}

export function markAuthSessionActive(): void {
    if (!canUseStorage()) return;
    try {
        window.localStorage.setItem(AUTH_SESSION_KEY, "1");
    } catch {
        // ignore storage errors
    }
}

export function clearAuthSessionFlag(): void {
    if (!canUseStorage()) return;
    try {
        window.localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
        // ignore storage errors
    }
}
